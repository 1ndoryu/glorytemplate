/*
 * Sistema de rollback transaccional.
 * Ejecuta pasos secuencialmente y revierte los completados si uno falla.
 */

use crate::error::CoolifyError;

use async_trait::async_trait;
use std::fmt;

/// Contexto compartido entre pasos de una transaccion.
#[derive(Debug, Default)]
pub struct TransactionContext {
    /// Datos generados por pasos anteriores (uuid del stack creado, container ids, etc).
    pub data: std::collections::HashMap<String, String>,
}

impl TransactionContext {
    pub fn set(&mut self, key: &str, value: String) {
        self.data.insert(key.to_string(), value);
    }

    pub fn get(&self, key: &str) -> Option<&str> {
        self.data.get(key).map(|s| s.as_str())
    }
}

/// Trait que cada paso de una transaccion debe implementar.
#[async_trait]
pub trait TransactionStep: Send + Sync + fmt::Display {
    async fn execute(&self, ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError>;
    async fn rollback(&self, ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError>;
}

/// Orquestador de transacciones con rollback automatico.
pub struct Transaction {
    steps: Vec<Box<dyn TransactionStep>>,
    completed: Vec<usize>,
}

impl Transaction {
    pub fn new() -> Self {
        Self {
            steps: Vec::new(),
            completed: Vec::new(),
        }
    }

    pub fn add<S: TransactionStep + 'static>(&mut self, step: S) {
        self.steps.push(Box::new(step));
    }

    /// Ejecuta todos los pasos. Si uno falla, revierte los completados en orden inverso.
    pub async fn run(&mut self, ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError> {
        let total = self.steps.len();

        for i in 0..total {
            let step = &self.steps[i];
            tracing::info!("Paso {}/{}: {}", i + 1, total, step);

            match step.execute(ctx).await {
                Ok(()) => {
                    self.completed.push(i);
                    tracing::info!("Paso {}/{} completado: {}", i + 1, total, step);
                }
                Err(e) => {
                    tracing::error!("Fallo en paso {}/{} '{}': {}", i + 1, total, step, e);
                    self.rollback_completed(ctx).await;
                    return Err(CoolifyError::RolledBack(format!(
                        "Fallo en '{}', {} paso(s) revertido(s). Error: {e}",
                        step,
                        self.completed.len()
                    )));
                }
            }
        }

        tracing::info!("Transaccion completada: {} pasos exitosos", total);
        Ok(())
    }

    async fn rollback_completed(&self, ctx: &mut TransactionContext) {
        for &i in self.completed.iter().rev() {
            let step = &self.steps[i];
            tracing::warn!("Revirtiendo paso: {}", step);
            if let Err(e) = step.rollback(ctx).await {
                tracing::error!("Rollback fallo para '{}': {}", step, e);
            }
        }
    }

    pub fn step_count(&self) -> usize {
        self.steps.len()
    }

    pub fn completed_count(&self) -> usize {
        self.completed.len()
    }
}

/* Paso noop para tests y pasos que no necesitan rollback */
pub struct NoopStep {
    name: String,
}

impl NoopStep {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
        }
    }
}

impl fmt::Display for NoopStep {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.name)
    }
}

#[async_trait]
impl TransactionStep for NoopStep {
    async fn execute(&self, _ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError> {
        Ok(())
    }

    async fn rollback(&self, _ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError> {
        Ok(())
    }
}

/* Paso que siempre falla (para tests) */
#[cfg(test)]
pub struct FailStep {
    name: String,
}

#[cfg(test)]
impl FailStep {
    pub fn new(name: &str) -> Self {
        Self {
            name: name.to_string(),
        }
    }
}

#[cfg(test)]
impl fmt::Display for FailStep {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.name)
    }
}

#[cfg(test)]
#[async_trait]
impl TransactionStep for FailStep {
    async fn execute(&self, _ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError> {
        Err(CoolifyError::Validation(format!("{} fallo intencionalmente", self.name)))
    }

    async fn rollback(&self, _ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError> {
        Ok(())
    }
}

/* Paso que registra su ejecucion y rollback (para tests) */
#[cfg(test)]
pub struct TrackingStep {
    name: String,
    tracker: std::sync::Arc<std::sync::Mutex<Vec<String>>>,
}

#[cfg(test)]
impl TrackingStep {
    pub fn new(name: &str, tracker: std::sync::Arc<std::sync::Mutex<Vec<String>>>) -> Self {
        Self {
            name: name.to_string(),
            tracker,
        }
    }
}

#[cfg(test)]
impl fmt::Display for TrackingStep {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.name)
    }
}

#[cfg(test)]
#[async_trait]
impl TransactionStep for TrackingStep {
    async fn execute(&self, _ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError> {
        self.tracker.lock().unwrap().push(format!("exec:{}", self.name));
        Ok(())
    }

    async fn rollback(&self, _ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError> {
        self.tracker.lock().unwrap().push(format!("rollback:{}", self.name));
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Mutex};

    #[tokio::test]
    async fn test_transaction_all_steps_succeed() {
        let mut tx = Transaction::new();
        tx.add(NoopStep::new("paso-1"));
        tx.add(NoopStep::new("paso-2"));
        tx.add(NoopStep::new("paso-3"));

        let mut ctx = TransactionContext::default();
        let result = tx.run(&mut ctx).await;
        assert!(result.is_ok());
        assert_eq!(tx.completed_count(), 3);
    }

    #[tokio::test]
    async fn test_transaction_rollback_on_failure() {
        let tracker = Arc::new(Mutex::new(Vec::new()));

        let mut tx = Transaction::new();
        tx.add(TrackingStep::new("A", tracker.clone()));
        tx.add(TrackingStep::new("B", tracker.clone()));
        tx.add(FailStep::new("C"));
        tx.add(TrackingStep::new("D", tracker.clone()));

        let mut ctx = TransactionContext::default();
        let result = tx.run(&mut ctx).await;

        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), CoolifyError::RolledBack(_)));

        let events = tracker.lock().unwrap().clone();
        /* A y B se ejecutaron */
        assert!(events.contains(&"exec:A".to_string()));
        assert!(events.contains(&"exec:B".to_string()));
        /* D no se ejecuto */
        assert!(!events.contains(&"exec:D".to_string()));
        /* A y B se revirtieron en orden inverso */
        assert!(events.contains(&"rollback:B".to_string()));
        assert!(events.contains(&"rollback:A".to_string()));

        /* Verificar orden: rollback B antes que rollback A */
        let rb_b = events.iter().position(|e| e == "rollback:B").unwrap();
        let rb_a = events.iter().position(|e| e == "rollback:A").unwrap();
        assert!(rb_b < rb_a);
    }

    #[tokio::test]
    async fn test_transaction_empty() {
        let mut tx = Transaction::new();
        let mut ctx = TransactionContext::default();
        assert!(tx.run(&mut ctx).await.is_ok());
        assert_eq!(tx.completed_count(), 0);
    }

    #[tokio::test]
    async fn test_transaction_first_step_fails() {
        let tracker = Arc::new(Mutex::new(Vec::new()));

        let mut tx = Transaction::new();
        tx.add(FailStep::new("A"));
        tx.add(TrackingStep::new("B", tracker.clone()));

        let mut ctx = TransactionContext::default();
        let result = tx.run(&mut ctx).await;

        assert!(result.is_err());
        let events = tracker.lock().unwrap().clone();
        /* Nada se ejecuto ni se revirtio */
        assert!(events.is_empty());
    }

    #[tokio::test]
    async fn test_transaction_context_data_sharing() {
        struct SetStep;
        impl fmt::Display for SetStep {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                write!(f, "SetStep")
            }
        }
        #[async_trait]
        impl TransactionStep for SetStep {
            async fn execute(&self, ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError> {
                ctx.set("uuid", "abc-123".to_string());
                Ok(())
            }
            async fn rollback(&self, _ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError> {
                Ok(())
            }
        }

        struct ReadStep {
            found: Arc<Mutex<Option<String>>>,
        }
        impl fmt::Display for ReadStep {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                write!(f, "ReadStep")
            }
        }
        #[async_trait]
        impl TransactionStep for ReadStep {
            async fn execute(&self, ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError> {
                let val = ctx.get("uuid").map(|s| s.to_string());
                *self.found.lock().unwrap() = val;
                Ok(())
            }
            async fn rollback(&self, _ctx: &mut TransactionContext) -> std::result::Result<(), CoolifyError> {
                Ok(())
            }
        }

        let found = Arc::new(Mutex::new(None));
        let mut tx = Transaction::new();
        tx.add(SetStep);
        tx.add(ReadStep { found: found.clone() });

        let mut ctx = TransactionContext::default();
        tx.run(&mut ctx).await.unwrap();

        assert_eq!(*found.lock().unwrap(), Some("abc-123".to_string()));
    }
}
