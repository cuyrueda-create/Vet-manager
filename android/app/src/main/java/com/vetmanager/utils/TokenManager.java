package com.vetmanager.utils;

import android.content.Context;
import android.content.SharedPreferences;

public class TokenManager {
    private static SharedPreferences getPrefs(Context context) {
        return context.getSharedPreferences(Constants.PREF_NAME, Context.MODE_PRIVATE);
    }

    public static void saveToken(Context context, String token) {
        getPrefs(context).edit().putString(Constants.KEY_TOKEN, token).apply();
    }

    public static String getToken(Context context) {
        return getPrefs(context).getString(Constants.KEY_TOKEN, null);
    }

    public static boolean isLoggedIn(Context context) {
        return getToken(context) != null;
    }

    public static void clearToken(Context context) {
        getPrefs(context).edit().remove(Constants.KEY_TOKEN).apply();
    }
}