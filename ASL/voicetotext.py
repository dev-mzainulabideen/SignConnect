import speech_recognition as sr
import keyboard

recognizer = sr.Recognizer()
mic = sr.Microphone()

print("🔁 Press [SPACEBAR] to start and stop recording...")

recording = False
audio_data = None

while True:
    if keyboard.is_pressed('space') and not recording:
        print("🎤 Recording started... Press [SPACEBAR] again to stop.")
        recording = True
        with mic as source:
            recognizer.adjust_for_ambient_noise(source)
            audio_data = recognizer.listen(source)
        print("⏹️ Recording stopped.")
        recording = False

        try:
            text = recognizer.recognize_google(audio_data)
            print("📝 Transcribed text:", text)
        except sr.UnknownValueError:
            print("❌ Could not understand the audio.")
        except sr.RequestError as e:
            print(f"❌ Error with the recognition service: {e}")
    elif keyboard.is_pressed('esc'):
        print("👋 Exiting.")
        break
