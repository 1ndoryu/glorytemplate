package com.kamples.mobile;

import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;

/* [2003A-26] Desactivar overscroll nativo del WebView Android.
 * El CSS overscroll-behavior:none desactiva el pull-to-refresh del navegador,
 * pero el glow/bounce de Android es a nivel de View — requiere setOverScrollMode.
 * La app tiene PTR propio (usePullToRefresh.ts) que usa touch events directos. */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getBridge().getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
    }
}
