package com.vetscribe.app;

import android.os.Bundle;
import android.view.View;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private WindowInsetsControllerCompat insetsController;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable edge-to-edge
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Get the insets controller for consistent bar control
        insetsController = new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());

        // Apply immersive mode
        applyImmersiveMode();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-apply immersive mode when app resumes to ensure bars stay hidden
        applyImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // Re-apply immersive mode when window gains focus
        if (hasFocus) {
            applyImmersiveMode();
        }
    }

    private void applyImmersiveMode() {
        if (insetsController != null) {
            // Hide both status bar and navigation bar
            insetsController.hide(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.navigationBars());
            // Bars will reappear with a swipe, then auto-hide again
            insetsController.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
    }
}
