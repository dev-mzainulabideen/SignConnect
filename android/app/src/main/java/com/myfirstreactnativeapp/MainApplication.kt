package com.myfirstreactnativeapp

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.myfirstreactnativeapp.hands.HandLandmarksPackage
import com.myfirstreactnativeapp.sign.SignClassifierPackage

class MainApplication : Application(), ReactApplication {

	override val reactNativeHost: ReactNativeHost =
			object : DefaultReactNativeHost(this) {
				override fun getPackages(): List<ReactPackage> =
					try {
						// Prefer the autolinked packages if available
						val clazz = Class.forName("com.facebook.react.PackageList")
						val ctor = clazz.getConstructor(ReactNativeHost::class.java)
						val instance = ctor.newInstance(this)
						val method = clazz.getMethod("getPackages")
						@Suppress("UNCHECKED_CAST")
						val pkgs = method.invoke(instance) as List<ReactPackage>
						pkgs + HandLandmarksPackage() + SignClassifierPackage()
					} catch (_: Throwable) {
						listOf(
							HandLandmarksPackage(),
							SignClassifierPackage()
						)
					}

				override fun getJSMainModuleName(): String = "index"

				override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

				override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
				override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
			}

	override val reactHost: ReactHost
		get() = getDefaultReactHost(applicationContext, reactNativeHost)

	override fun onCreate() {
		super.onCreate()
		loadReactNative(this)
	}
}
