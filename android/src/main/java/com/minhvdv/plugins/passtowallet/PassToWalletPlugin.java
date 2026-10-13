package com.minhvdv.plugins.passtowallet;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.pay.Pay;
import com.google.android.gms.pay.PayApiAvailabilityStatus;
import com.google.android.gms.pay.PayClient;

/**
 * Google Wallet through the Google Pay API. PayClient only reports results via
 * onActivityResult with a request code, so this uses the request-code bridge
 * (deprecated in Capacitor but still forwarded by BridgeActivity in 6, 7 and 8).
 */
@CapacitorPlugin(name = "PassToWallet", requestCodes = { PassToWalletPlugin.SAVE_PASSES_REQUEST_CODE })
public class PassToWalletPlugin extends Plugin {

    static final int SAVE_PASSES_REQUEST_CODE = 9201;

    private PluginCall pendingSave;

    @PluginMethod
    public void isAvailable(PluginCall call) {
        Pay.getClient(getActivity())
            .getPayApiAvailabilityStatus(PayClient.RequestType.SAVE_PASSES)
            .addOnSuccessListener((status) -> resolveAvailable(call, status == PayApiAvailabilityStatus.AVAILABLE))
            .addOnFailureListener((error) -> resolveAvailable(call, false));
    }

    /** Resolves `{ saved }`: true on RESULT_OK, false on RESULT_CANCELED. */
    @PluginMethod
    public void savePassesJwt(PluginCall call) {
        String jwt = call.getString("jwt");
        if (jwt == null || jwt.isEmpty()) {
            call.reject("jwt is required");
            return;
        }
        if (pendingSave != null) {
            call.reject("Save already in progress");
            return;
        }
        pendingSave = call;
        Activity activity = getActivity();
        activity.runOnUiThread(() -> Pay.getClient(activity).savePassesJwt(jwt, activity, SAVE_PASSES_REQUEST_CODE));
    }

    /**
     * Opens a saved pass link in Google Wallet. Google Play services hosts the
     * Wallet deep link; an implicit intent lets the browser compete for it.
     */
    @PluginMethod
    public void openGooglePass(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url is required");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE);
        try {
            getActivity().startActivity(intent.setPackage("com.google.android.gms"));
        } catch (ActivityNotFoundException withoutWallet) {
            try {
                getActivity().startActivity(intent.setPackage(null));
            } catch (ActivityNotFoundException noHandler) {
                call.reject("Unable to open pass");
                return;
            }
        }
        call.resolve();
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode != SAVE_PASSES_REQUEST_CODE || pendingSave == null) return;
        PluginCall call = pendingSave;
        pendingSave = null;
        if (resultCode == Activity.RESULT_OK || resultCode == Activity.RESULT_CANCELED) {
            // Google Wallet has no API to read saved passes: this result is the
            // only on-device signal that the pass was saved.
            JSObject result = new JSObject();
            result.put("saved", resultCode == Activity.RESULT_OK);
            call.resolve(result);
            return;
        }
        String message = data == null ? null : data.getStringExtra(PayClient.EXTRA_API_ERROR_MESSAGE);
        call.reject(
            message != null ? message : "Unable to save pass",
            resultCode == PayClient.SavePassesResult.SAVE_ERROR ? "SAVE_ERROR" : "UNKNOWN_RESULT"
        );
    }

    private void resolveAvailable(PluginCall call, boolean available) {
        JSObject result = new JSObject();
        result.put("available", available);
        call.resolve(result);
    }
}
