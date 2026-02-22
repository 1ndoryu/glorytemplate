/*
 * Kamples Desktop — entry point
 * Delegamos a lib.rs para soportar tanto desktop como mobile.
 */

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    kamples_desktop_lib::run()
}
