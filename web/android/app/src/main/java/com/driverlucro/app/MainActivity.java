package com.driverlucro.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Registrar plugins nativos antes do super.onCreate
        registerPlugin(NotificationListenerPlugin.class);
        registerPlugin(OverlayPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
