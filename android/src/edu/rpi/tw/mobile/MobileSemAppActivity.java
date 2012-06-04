package edu.rpi.tw.mobile;

import android.os.Bundle;
import android.view.WindowManager;

import com.phonegap.*;

public class MobileSemAppActivity extends DroidGap {
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, 
                WindowManager.LayoutParams.FLAG_FULLSCREEN | 
                WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
        super.loadUrl("file:///android_asset/www/index.html");
    }
}