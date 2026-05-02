package com.myfirstreactnativeapp.hands

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

// MediaPipe Tasks Hands
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarkerResult
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.framework.image.MPImage
import java.io.File
import java.io.FileOutputStream

class HandLandmarksModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
	private var landmarker: HandLandmarker? = null

	override fun getName(): String = "HandLandmarks"

	private fun loadTaskModelBuffer(assetName: String): java.nio.ByteBuffer {
		val input = ctx.assets.open(assetName)
		val bytes = input.readBytes()
		input.close()
		val buf = java.nio.ByteBuffer.allocateDirect(bytes.size)
		buf.put(bytes)
		buf.rewind()
		return buf
	}

	@Synchronized
	private fun ensureLandmarker(): Boolean {
		if (landmarker != null) return true
		return try {
			android.util.Log.d("HandLandmarks", "Initializing MediaPipe landmarker (buffer load)...")
			val modelBuf = loadTaskModelBuffer("hand_landmarker.task")

			val base = BaseOptions.builder()
				.setModelAssetBuffer(modelBuf)
				.build()

			val options = HandLandmarker.HandLandmarkerOptions.builder()
				.setBaseOptions(base)
				.setRunningMode(RunningMode.IMAGE)
				.setNumHands(1)
				.setMinHandDetectionConfidence(0.5f)
				.setMinHandPresenceConfidence(0.5f)
				.setMinTrackingConfidence(0.5f)
				.build()

			landmarker = HandLandmarker.createFromOptions(ctx, options)
			android.util.Log.d("HandLandmarks", "HandLandmarker created successfully")
			true
		} catch (e: Throwable) {
			android.util.Log.e("HandLandmarks", "Failed to initialize MediaPipe landmarker", e)
			landmarker = null
			false
		}
	}

	private fun ensureTaskModelInCache(assetName: String): File {
		val cache = File(ctx.cacheDir, assetName)
		if (cache.exists() && cache.length() > 0) {
			android.util.Log.d("HandLandmarks", "Model file already in cache: ${cache.absolutePath}")
			return cache
		}
		android.util.Log.d("HandLandmarks", "Copying model file from assets to cache...")
		try {
			ctx.assets.open(assetName).use { ins ->
				FileOutputStream(cache).use { outs ->
					ins.copyTo(outs)
				}
			}
			android.util.Log.d("HandLandmarks", "Model file copied successfully to: ${cache.absolutePath}")
			android.util.Log.d("HandLandmarks", "Copied file size: ${cache.length()} bytes")
		} catch (e: Exception) {
			android.util.Log.e("HandLandmarks", "Failed to copy model file from assets", e)
			throw e
		}
		return cache
	}

	@ReactMethod
	fun detect(base64Image: String, promise: Promise) {
		try {
			if (!ensureLandmarker()) {
				android.util.Log.e("HandLandmarks", "Failed to initialize MediaPipe landmarker")
				promise.resolve(Arguments.createArray())
				return
			}
			// Strip data URI prefix if present
			val cleanB64 = if (base64Image.startsWith("data:")) base64Image.substringAfter("base64,") else base64Image
			val bytes = Base64.decode(cleanB64, Base64.DEFAULT)
			val decoded0 = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: run {
				android.util.Log.e("HandLandmarks", "Failed to decode bitmap from base64")
				promise.resolve(Arguments.createArray())
				return
			}
			android.util.Log.d("HandLandmarks", "Bitmap decoded: ${decoded0.width}x${decoded0.height}")
			// Ensure ARGB_8888, scale longest side to <=512, keep full frame (no center crop)
			val srcBmp1 = if (decoded0.config != Bitmap.Config.ARGB_8888) decoded0.copy(Bitmap.Config.ARGB_8888, false) else decoded0
			val maxSide = maxOf(srcBmp1.width, srcBmp1.height)
			val scale = if (maxSide > 512) 512f / maxSide else 1f
			val targetW = (srcBmp1.width * scale).toInt().coerceAtLeast(1)
			val targetH = (srcBmp1.height * scale).toInt().coerceAtLeast(1)
			val bmp = if (scale != 1f) Bitmap.createScaledBitmap(srcBmp1, targetW, targetH, true) else srcBmp1
			
			val mpImage = BitmapImageBuilder(bmp).build()
			val result: HandLandmarkerResult = landmarker!!.detect(mpImage)
			android.util.Log.d("HandLandmarks", "MediaPipe detection result: ${result.landmarks().size} hands, ${result.handednesses().size} handednesses")
			
			val out: WritableArray = Arguments.createArray()
			val handLandmarks: WritableArray = Arguments.createArray()
			
			if (result.handednesses().isNotEmpty() && result.landmarks().isNotEmpty()) {
				val lm = result.landmarks()[0]
				android.util.Log.d("HandLandmarks", "Processing ${lm.size} landmarks")
				for (pt in lm) {
					val m: WritableMap = Arguments.createMap()
					m.putDouble("x", (pt.x() * bmp.width).toDouble())
					m.putDouble("y", (pt.y() * bmp.height).toDouble())
					out.pushMap(m)
					
					// Create separate entry for hands array
					val handM: WritableMap = Arguments.createMap()
					handM.putDouble("x", (pt.x() * bmp.width).toDouble())
					handM.putDouble("y", (pt.y() * bmp.height).toDouble())
					handLandmarks.pushMap(handM)
				}
			} else {
				android.util.Log.w("HandLandmarks", "No hands detected in image")
			}

			// Return flexible shape: both flat array and hands[0].landmarks plus debug info
			val resMap: WritableMap = Arguments.createMap()
			resMap.putArray("landmarks", out)
			
			val handMap: WritableMap = Arguments.createMap()
			handMap.putArray("landmarks", handLandmarks)
			handMap.putDouble("score", 1.0)
			val handsArr: WritableArray = Arguments.createArray()
			handsArr.pushMap(handMap)
			resMap.putArray("hands", handsArr)
			val dbg = "bmp=${bmp.width}x${bmp.height}; hands=${result.landmarks().size}; lmCount=${if (result.landmarks().isNotEmpty()) result.landmarks()[0].size else 0}"
			resMap.putString("debug", dbg)
			promise.resolve(resMap)
		} catch (e: Throwable) {
			android.util.Log.e("HandLandmarks", "Error in detect method", e)
			promise.resolve(Arguments.createArray())
		}
	}

	@ReactMethod
	fun detectFromPath(imagePath: String, promise: Promise) {
		try {
			if (!ensureLandmarker()) {
				promise.resolve(Arguments.createArray()); return
			}
			val path = if (imagePath.startsWith("file://")) imagePath.removePrefix("file://") else imagePath
			var decoded0: Bitmap? = null
			try {
				decoded0 = BitmapFactory.decodeFile(path)
			} catch (_: Throwable) {}
			if (decoded0 == null) {
				// Try content resolver
				try {
					val uri = Uri.parse(imagePath)
					ctx.contentResolver.openInputStream(uri)?.use { ins ->
						decoded0 = BitmapFactory.decodeStream(ins)
					}
				} catch (_: Throwable) {}
			}
			val bmp0 = decoded0 ?: run {
				android.util.Log.e("HandLandmarks", "Failed to decode from path: $imagePath")
				promise.resolve(Arguments.createArray()); return
			}
			val srcBmp1 = if (bmp0.config != Bitmap.Config.ARGB_8888) bmp0.copy(Bitmap.Config.ARGB_8888, false) else bmp0
			val maxSide = maxOf(srcBmp1.width, srcBmp1.height)
			val scale = if (maxSide > 512) 512f / maxSide else 1f
			val targetW = (srcBmp1.width * scale).toInt().coerceAtLeast(1)
			val targetH = (srcBmp1.height * scale).toInt().coerceAtLeast(1)
			val bmp = if (scale != 1f) Bitmap.createScaledBitmap(srcBmp1, targetW, targetH, true) else srcBmp1
			val result: HandLandmarkerResult = landmarker!!.detect(BitmapImageBuilder(bmp).build())
			val out: WritableArray = Arguments.createArray()
			if (result.landmarks().isNotEmpty()) {
				for (pt in result.landmarks()[0]) {
					val m: WritableMap = Arguments.createMap()
					m.putDouble("x", (pt.x() * bmp.width).toDouble())
					m.putDouble("y", (pt.y() * bmp.height).toDouble())
					out.pushMap(m)
				}
			}
			val resMap: WritableMap = Arguments.createMap()
			resMap.putArray("landmarks", out)
			promise.resolve(resMap)
		} catch (e: Throwable) {
			android.util.Log.e("HandLandmarks", "detectFromPath error", e)
			promise.resolve(Arguments.createArray())
		}
	}

	@ReactMethod
	fun init(promise: Promise) {
		try {
			val ok = ensureLandmarker()
			promise.resolve(ok)
		} catch (e: Throwable) {
			android.util.Log.e("HandLandmarks", "init error", e)
			promise.resolve(false)
		}
	}
}
