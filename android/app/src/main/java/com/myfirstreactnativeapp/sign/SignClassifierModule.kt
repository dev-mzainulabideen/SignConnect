package com.myfirstreactnativeapp.sign

import android.content.res.AssetManager
import com.facebook.react.bridge.*
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.channels.FileChannel

class SignClassifierModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  private var interpreter: Interpreter? = null
  private var inputShape: IntArray = intArrayOf(1, 400, 400, 3)
  private var outputSize: Int = 0
  private var expectedInputFloats: Int = 1 * 400 * 400 * 3
  private var inputBuffer: ByteBuffer? = null
  private var outputArray: Array<FloatArray>? = null

  override fun getName(): String = "SignClassifier"

  private fun loadModelBuffer(assetPath: String): ByteBuffer {
    val afd = ctx.assets.openFd(assetPath)
    val inputStream = FileInputStream(afd.fileDescriptor)
    val fileChannel = inputStream.channel
    val startOffset = afd.startOffset
    val declaredLength = afd.declaredLength
    return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
  }

  @ReactMethod
  fun init(modelAsset: String?, promise: Promise) {
    try {
      if (interpreter != null) {
        promise.resolve(true)
        return
      }
      val assetPath = modelAsset ?: "models/sign_model.tflite"
      val model = loadModelBuffer(assetPath)
      interpreter = Interpreter(model)
      try {
        val intr = interpreter
        if (intr != null) {
          val outTensor = intr.getOutputTensor(0)
          outputSize = outTensor.numElements()
          val inTensor = intr.getInputTensor(0)
          inputShape = inTensor.shape()
          // Pre-allocate reusable buffers
          expectedInputFloats = inputShape[0] * inputShape[1] * inputShape[2] * inputShape[3]
          inputBuffer = ByteBuffer.allocateDirect(expectedInputFloats * 4).order(ByteOrder.nativeOrder())
          val outClasses = if (outputSize > 0) outputSize else 8
          outputArray = Array(1) { FloatArray(outClasses) }
        }
      } catch (_: Throwable) {
        // Fallback remains default shapes
        // Ensure buffers exist even if tensor queries failed
        if (inputBuffer == null) inputBuffer = ByteBuffer.allocateDirect(expectedInputFloats * 4).order(ByteOrder.nativeOrder())
        if (outputArray == null) outputArray = Array(1) { FloatArray(if (outputSize > 0) outputSize else 8) }
      }
      promise.resolve(true)
    } catch (e: Throwable) {
      promise.reject("init_error", e)
    }
  }

  @ReactMethod
  fun inferImageChunked(chunk1: ReadableArray, chunk2: ReadableArray, chunk3: ReadableArray, promise: Promise) {
    try {
      val intr = interpreter ?: run { promise.reject("not_initialized", "Interpreter not initialized"); return }
      val expected = expectedInputFloats
      
      // Combine chunks
      val totalSize = chunk1.size() + chunk2.size() + chunk3.size()
      android.util.Log.d("SignClassifier", "Chunked input sizes: ${chunk1.size()}, ${chunk2.size()}, ${chunk3.size()}, total: $totalSize, expected: $expected")
      
      if (totalSize != expected) {
        android.util.Log.e("SignClassifier", "Size mismatch: got $totalSize, expected $expected")
        promise.reject("bad_input", "Expected $expected floats, got $totalSize")
        return
      }
      
      // Create fresh buffer
      val buf = ByteBuffer.allocateDirect(expected * 4).order(ByteOrder.nativeOrder())
      
      // Process chunks
      val chunks = listOf(chunk1, chunk2, chunk3)
      for (chunk in chunks) {
        for (i in 0 until chunk.size()) {
          try {
            val value = chunk.getDouble(i)
            if (!value.isFinite()) {
              android.util.Log.w("SignClassifier", "Non-finite value, using 0.0")
              buf.putFloat(0.0f)
            } else {
              buf.putFloat(value.toFloat())
            }
          } catch (e: Exception) {
            android.util.Log.e("SignClassifier", "Error reading chunk value: ${e.message}")
            buf.putFloat(0.0f)
          }
        }
      }
      buf.rewind()

      // Run inference
      val output = Array(1) { FloatArray(if (outputSize > 0) outputSize else 8) }
      intr.run(buf, output)

      val outArr = Arguments.createArray()
      val out = output[0]
      for (i in out.indices) {
        outArr.pushDouble(out[i].toDouble())
      }
      
      android.util.Log.d("SignClassifier", "Chunked inference successful, output size: ${out.size}")
      promise.resolve(outArr)
    } catch (e: Throwable) {
      android.util.Log.e("SignClassifier", "Error in inferImageChunked", e)
      promise.reject("inference_error", e.message ?: "Unknown error")
    }
  }

  @ReactMethod
  fun inferImage(flatInput: ReadableArray, promise: Promise) {
    try {
      val intr = interpreter ?: run { promise.reject("not_initialized", "Interpreter not initialized"); return }
      val expected = expectedInputFloats
      android.util.Log.d("SignClassifier", "Input size: ${flatInput.size()}, expected: $expected")
      android.util.Log.d("SignClassifier", "ReadableArray type: ${flatInput.javaClass.simpleName}")
      
      if (flatInput.size() != expected) {
        android.util.Log.e("SignClassifier", "Size mismatch: got ${flatInput.size()}, expected $expected")
        promise.reject("bad_input", "Expected $expected floats, got ${flatInput.size()}")
        return
      }
      
      // Create fresh buffer for each call to avoid "field sizes are different" error
      val buf = ByteBuffer.allocateDirect(expected * 4).order(ByteOrder.nativeOrder())
      
      // Copy floats into pre-allocated buffer with validation
      for (i in 0 until flatInput.size()) {
        try {
          val value = flatInput.getDouble(i)
          if (!value.isFinite()) {
            android.util.Log.w("SignClassifier", "Non-finite value at index $i: $value")
            buf.putFloat(0.0f)
          } else {
            buf.putFloat(value.toFloat())
          }
        } catch (e: Exception) {
          android.util.Log.e("SignClassifier", "Error reading value at index $i: ${e.message}")
          // Instead of rejecting, put a default value and continue
          buf.putFloat(0.0f)
        }
      }
      buf.rewind()

      // Create fresh output array for each call
      val output = Array(1) { FloatArray(if (outputSize > 0) outputSize else 8) }
      intr.run(buf, output)

      val outArr = Arguments.createArray()
      val out = output[0]
      for (i in out.indices) {
        outArr.pushDouble(out[i].toDouble())
      }
      android.util.Log.d("SignClassifier", "Inference successful, output size: ${out.size}")
      promise.resolve(outArr)
    } catch (e: Throwable) {
      android.util.Log.e("SignClassifier", "Inference error: ${e.message}", e)
      promise.reject("infer_error", e)
    }
  }
}


