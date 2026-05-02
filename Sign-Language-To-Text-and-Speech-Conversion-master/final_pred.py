# Importing Libraries
import numpy as np
import math
import cv2

import os, sys
import traceback
import pyttsx3
from keras.models import load_model
from cvzone.HandTrackingModule import HandDetector
from string import ascii_uppercase
import enchant
ddd=enchant.Dict("en-US")
hd = HandDetector(maxHands=1)
hd2 = HandDetector(maxHands=1)
import tkinter as tk
from tkinter import ttk
from tkinter import filedialog
from PIL import Image, ImageTk
import cv2
import numpy as np

offset=29


os.environ["THEANO_FLAGS"] = "device=cuda, assert_no_cpu_op=True"


# Application :

class Application:

    def __init__(self):
        self.vs = cv2.VideoCapture(0)
        self.current_image = None
        self.model = load_model('cnn8grps_rad1_model.h5')
        self.speak_engine=pyttsx3.init()
        self.speak_engine.setProperty("rate",100)
        voices=self.speak_engine.getProperty("voices")
        self.speak_engine.setProperty("voice",voices[0].id)

        self.ct = {}
        self.ct['blank'] = 0
        self.blank_flag = 0
        self.space_flag=False
        self.next_flag=True
        self.prev_char=""
        self.count=-1
        self.ten_prev_char=[]
        for i in range(10):
            self.ten_prev_char.append(" ")


        for i in ascii_uppercase:
            self.ct[i] = 0
        print("Loaded model from disk")


        # Modern color scheme
        self.colors = {
            'bg_primary': '#1a1a2e',      # Dark blue
            'bg_secondary': '#16213e',     # Darker blue
            'bg_tertiary': '#0f3460',      # Navy blue
            'accent': '#e94560',           # Red accent
            'accent_light': '#f39c12',     # Orange accent
            'text_primary': '#ffffff',     # White text
            'text_secondary': '#bdc3c7',   # Light gray
            'success': '#27ae60',          # Green
            'warning': '#f39c12',          # Orange
            'border': '#34495e'            # Gray border
        }

        self.root = tk.Tk()
        self.root.title("🤟 Sign Language To Text & Speech Converter")
        self.root.protocol('WM_DELETE_WINDOW', self.destructor)
        self.root.geometry("1400x800")
        self.root.configure(bg=self.colors['bg_primary'])
        
        # Configure style
        style = tk.ttk.Style()
        style.theme_use('clam')
        
        # Configure button styles with hover effects
        style.configure('Modern.TButton',
                       background=self.colors['accent'],
                       foreground=self.colors['text_primary'],
                       font=('Segoe UI', 12, 'bold'),
                       borderwidth=0,
                       focuscolor='none',
                       padding=(10, 8))
        
        style.map('Modern.TButton',
                 background=[('active', '#c0392b'), ('pressed', '#a93226')])
        
        style.configure('Secondary.TButton',
                       background=self.colors['accent_light'],
                       foreground=self.colors['text_primary'],
                       font=('Segoe UI', 12, 'bold'),
                       borderwidth=0,
                       focuscolor='none',
                       padding=(10, 8))
        
        style.map('Secondary.TButton',
                 background=[('active', '#e67e22'), ('pressed', '#d35400')])
        
        style.configure('Success.TButton',
                       background=self.colors['success'],
                       foreground=self.colors['text_primary'],
                       font=('Segoe UI', 12, 'bold'),
                       borderwidth=0,
                       focuscolor='none',
                       padding=(10, 8))
        
        style.map('Success.TButton',
                 background=[('active', '#229954'), ('pressed', '#1e8449')])

        # Main title with modern styling
        self.T = tk.Label(self.root, 
                         text="🤟 Sign Language To Text & Speech Converter", 
                         font=("Segoe UI", 28, "bold"),
                         fg=self.colors['text_primary'],
                         bg=self.colors['bg_primary'])
        self.T.place(x=20, y=20)

        # Camera feed panel with modern border
        self.panel = tk.Label(self.root, 
                             relief="solid", 
                             borderwidth=2,
                             bg=self.colors['bg_secondary'])
        self.panel.place(x=30, y=80, width=500, height=400)

        # Hand skeleton panel with modern border
        self.panel2 = tk.Label(self.root,
                              relief="solid",
                              borderwidth=2,
                              bg=self.colors['bg_secondary'])
        self.panel2.place(x=550, y=80, width=400, height=400)

        # Status panel
        status_frame = tk.Frame(self.root, 
                               bg=self.colors['bg_secondary'],
                               relief="solid",
                               borderwidth=2)
        status_frame.place(x=30, y=500, width=920, height=120)

        # Current character display
        self.T1 = tk.Label(status_frame,
                          text="Current Character:",
                          font=("Segoe UI", 16, "bold"),
                          fg=self.colors['text_secondary'],
                          bg=self.colors['bg_secondary'])
        self.T1.place(x=20, y=10)

        # Character display with modern styling
        char_display_frame = tk.Frame(status_frame,
                                    bg=self.colors['accent'],
                                    relief="solid",
                                    borderwidth=2)
        char_display_frame.place(x=200, y=5, width=60, height=50)
        
        self.panel3 = tk.Label(char_display_frame,
                              text="",
                              font=("Segoe UI", 24, "bold"),
                              fg=self.colors['text_primary'],
                              bg=self.colors['accent'])
        self.panel3.place(x=15, y=10)

        # Sentence display
        self.T3 = tk.Label(status_frame,
                          text="Sentence:",
                          font=("Segoe UI", 16, "bold"),
                          fg=self.colors['text_secondary'],
                          bg=self.colors['bg_secondary'])
        self.T3.place(x=20, y=50)

        self.panel5 = tk.Label(status_frame,
                              text="",
                              font=("Segoe UI", 18),
                              fg=self.colors['text_primary'],
                              bg=self.colors['bg_secondary'],
                              wraplength=800,
                              justify="left")
        self.panel5.place(x=120, y=50)

        # Suggestions panel
        suggestions_frame = tk.Frame(self.root,
                                   bg=self.colors['bg_tertiary'],
                                   relief="solid",
                                   borderwidth=2)
        suggestions_frame.place(x=30, y=640, width=920, height=80)

        self.T4 = tk.Label(suggestions_frame,
                          text="💡 Word Suggestions:",
                          font=("Segoe UI", 14, "bold"),
                          fg=self.colors['accent_light'],
                          bg=self.colors['bg_tertiary'])
        self.T4.place(x=20, y=10)

        # Modern suggestion buttons
        self.b1 = tk.Button(suggestions_frame,
                           text="",
                           command=self.action1,
                           bg=self.colors['accent'],
                           fg=self.colors['text_primary'],
                           font=('Segoe UI', 12, 'bold'),
                           relief='flat',
                           borderwidth=0,
                           activebackground='#c0392b',
                           activeforeground=self.colors['text_primary'])
        self.b1.place(x=20, y=40, width=180, height=30)

        self.b2 = tk.Button(suggestions_frame,
                           text="",
                           command=self.action2,
                           bg=self.colors['accent'],
                           fg=self.colors['text_primary'],
                           font=('Segoe UI', 12, 'bold'),
                           relief='flat',
                           borderwidth=0,
                           activebackground='#c0392b',
                           activeforeground=self.colors['text_primary'])
        self.b2.place(x=220, y=40, width=180, height=30)

        self.b3 = tk.Button(suggestions_frame,
                           text="",
                           command=self.action3,
                           bg=self.colors['accent'],
                           fg=self.colors['text_primary'],
                           font=('Segoe UI', 12, 'bold'),
                           relief='flat',
                           borderwidth=0,
                           activebackground='#c0392b',
                           activeforeground=self.colors['text_primary'])
        self.b3.place(x=420, y=40, width=180, height=30)

        self.b4 = tk.Button(suggestions_frame,
                           text="",
                           command=self.action4,
                           bg=self.colors['accent'],
                           fg=self.colors['text_primary'],
                           font=('Segoe UI', 12, 'bold'),
                           relief='flat',
                           borderwidth=0,
                           activebackground='#c0392b',
                           activeforeground=self.colors['text_primary'])
        self.b4.place(x=620, y=40, width=180, height=30)

        # Control panel
        control_frame = tk.Frame(self.root,
                               bg=self.colors['bg_secondary'],
                               relief="solid",
                               borderwidth=2)
        control_frame.place(x=980, y=80, width=380, height=600)

        # Control panel title
        control_title = tk.Label(control_frame,
                               text="🎛️ Controls",
                               font=("Segoe UI", 18, "bold"),
                               fg=self.colors['text_primary'],
                               bg=self.colors['bg_secondary'])
        control_title.place(x=20, y=20)

        # Action buttons with modern styling
        self.speak = tk.Button(control_frame,
                             text="🔊 Speak Text",
                             command=self.speak_fun,
                             bg=self.colors['success'],
                             fg=self.colors['text_primary'],
                             font=('Segoe UI', 14, 'bold'),
                             relief='flat',
                             borderwidth=0,
                             activebackground='#229954',
                             activeforeground=self.colors['text_primary'])
        self.speak.place(x=30, y=80, width=320, height=50)

        self.clear = tk.Button(control_frame,
                             text="🗑️ Clear Text",
                             command=self.clear_fun,
                             bg=self.colors['accent_light'],
                             fg=self.colors['text_primary'],
                             font=('Segoe UI', 14, 'bold'),
                             relief='flat',
                             borderwidth=0,
                             activebackground='#e67e22',
                             activeforeground=self.colors['text_primary'])
        self.clear.place(x=30, y=150, width=320, height=50)

        # Gallery control buttons (always visible)
        self.load_image = tk.Button(control_frame,
                                  text="📷 Load Image",
                                  command=self.load_image_from_gallery,
                                  bg=self.colors['accent'],
                                  fg=self.colors['text_primary'],
                                  font=('Segoe UI', 11, 'bold'),
                                  relief='flat',
                                  borderwidth=0,
                                  activebackground='#2980b9',
                                  activeforeground=self.colors['text_primary'])
        self.load_image.place(x=30, y=220, width=150, height=35)
        
        # Multiple images button
        self.load_multiple_images = tk.Button(
                                  control_frame,
                                  text="📷📷 Multiple Images",
                                  command=self.load_multiple_images_from_gallery,
                                  bg=self.colors['accent'],
                                  fg=self.colors['text_primary'],
                                  font=('Segoe UI', 11, 'bold'),
                                  relief='flat',
                                  borderwidth=0,
                                  activebackground='#2980b9',
                                  activeforeground=self.colors['text_primary'])
        self.load_multiple_images.place(x=200, y=220, width=150, height=35)
        
        # Step-by-step image loading button
        self.load_next_image = tk.Button(
                                  control_frame,
                                  text="📷 Next Image",
                                  command=self.load_next_image_for_sentence,
                                  bg=self.colors['success'],
                                  fg=self.colors['text_primary'],
                                  font=('Segoe UI', 11, 'bold'),
                                  relief='flat',
                                  borderwidth=0,
                                  activebackground='#27ae60',
                                  activeforeground=self.colors['text_primary'])
        self.load_next_image.place(x=30, y=265, width=150, height=35)
        self.load_next_image.place_forget()  # Initially hidden
        
        # Start building sentence button
        self.start_building = tk.Button(
                                  control_frame,
                                  text="🏗️ Start Building",
                                  command=self.start_sentence_building,
                                  bg=self.colors['warning'],
                                  fg=self.colors['text_primary'],
                                  font=('Segoe UI', 11, 'bold'),
                                  relief='flat',
                                  borderwidth=0,
                                  activebackground='#f39c12',
                                  activeforeground=self.colors['text_primary'])
        self.start_building.place(x=200, y=265, width=150, height=35)
        
        # Clear last character button (for building mode)
        self.clear_last_char = tk.Button(
                                  control_frame,
                                  text="⌫ Clear Last",
                                  command=self.clear_last_character,
                                  bg=self.colors['accent'],
                                  fg=self.colors['text_primary'],
                                  font=('Segoe UI', 11, 'bold'),
                                  relief='flat',
                                  borderwidth=0,
                                  activebackground='#e74c3c',
                                  activeforeground=self.colors['text_primary'])
        self.clear_last_char.place(x=30, y=310, width=150, height=35)
        self.clear_last_char.place_forget()  # Initially hidden

        self.load_video = tk.Button(control_frame,
                                  text="🎥 Load Video",
                                  command=self.load_video_from_gallery,
                                  bg=self.colors['accent'],
                                  fg=self.colors['text_primary'],
                                  font=('Segoe UI', 11, 'bold'),
                                  relief='flat',
                                  borderwidth=0,
                                  activebackground='#2980b9',
                                  activeforeground=self.colors['text_primary'])
        self.load_video.place(x=200, y=220, width=150, height=35)

        # Back to camera button (always visible)
        self.back_to_camera = tk.Button(control_frame,
                                      text="📹 Back to Camera",
                                      command=self.switch_to_camera_mode,
                                      bg=self.colors['success'],
                                      fg=self.colors['text_primary'],
                                      font=('Segoe UI', 11, 'bold'),
                                      relief='flat',
                                      borderwidth=0,
                                      activebackground='#229954',
                                      activeforeground=self.colors['text_primary'])
        self.back_to_camera.place(x=30, y=265, width=320, height=35)

        # Video control buttons (initially hidden)
        self.play_video = tk.Button(control_frame,
                                  text="▶️ Play Video",
                                  command=self.play_video_processing,
                                  bg=self.colors['success'],
                                  fg=self.colors['text_primary'],
                                  font=('Segoe UI', 11, 'bold'),
                                  relief='flat',
                                  borderwidth=0,
                                  activebackground='#229954',
                                  activeforeground=self.colors['text_primary'])
        self.play_video.place(x=30, y=310, width=150, height=35)
        self.play_video.place_forget()  # Initially hidden

        self.stop_video = tk.Button(control_frame,
                                  text="⏹️ Stop Video",
                                  command=self.stop_video_processing,
                                  bg=self.colors['accent'],
                                  fg=self.colors['text_primary'],
                                  font=('Segoe UI', 11, 'bold'),
                                  relief='flat',
                                  borderwidth=0,
                                  activebackground='#c0392b',
                                  activeforeground=self.colors['text_primary'])
        self.stop_video.place(x=200, y=310, width=150, height=35)
        self.stop_video.place_forget()  # Initially hidden

        # Clear gallery button (initially hidden)
        self.clear_gallery = tk.Button(control_frame,
                                     text="🗑️ Clear Gallery",
                                     command=self.clear_gallery_display,
                                     bg=self.colors['accent'],
                                     fg=self.colors['text_primary'],
                                     font=('Segoe UI', 11, 'bold'),
                                     relief='flat',
                                     borderwidth=0,
                                     activebackground='#c0392b',
                                     activeforeground=self.colors['text_primary'])
        self.clear_gallery.place(x=30, y=355, width=320, height=35)
        self.clear_gallery.place_forget()  # Initially hidden
        
        # Use Sentence button (for multiple images)
        self.use_sentence = tk.Button(
            control_frame,
            text="✅ Use Sentence",
            command=self.use_current_sentence,
            bg=self.colors['success'],
            fg=self.colors['text_primary'],
            font=('Segoe UI', 11, 'bold'),
            relief='flat',
            borderwidth=0,
            activebackground='#27ae60',
            activeforeground=self.colors['text_primary']
        )
        self.use_sentence.place(x=30, y=400, width=320, height=35)
        self.use_sentence.place_forget()  # Initially hidden

        # Instructions panel
        instructions_frame = tk.Frame(control_frame,
                                    bg=self.colors['bg_tertiary'],
                                    relief="solid",
                                    borderwidth=1)
        instructions_frame.place(x=20, y=400, width=340, height=140)

        instructions_title = tk.Label(instructions_frame,
                                    text="📋 Instructions",
                                    font=("Segoe UI", 14, "bold"),
                                    fg=self.colors['text_primary'],
                                    bg=self.colors['bg_tertiary'])
        instructions_title.place(x=10, y=10)

        instructions_text = tk.Label(instructions_frame,
                                   text="• Show hand gestures in front of camera\n• Load images/videos from gallery\n• Keep hand in good lighting\n• Make clear sign language gestures\n• Use suggestions to improve accuracy\n• Click 'Speak' to hear the text",
                                   font=("Segoe UI", 10),
                                   fg=self.colors['text_secondary'],
                                   bg=self.colors['bg_tertiary'],
                                   justify="left")
        instructions_text.place(x=10, y=40)

        # Status indicator
        status_indicator_frame = tk.Frame(control_frame,
                                        bg=self.colors['bg_tertiary'],
                                        relief="solid",
                                        borderwidth=1)
        status_indicator_frame.place(x=20, y=550, width=340, height=60)

        status_title = tk.Label(status_indicator_frame,
                              text="📊 Status",
                              font=("Segoe UI", 14, "bold"),
                              fg=self.colors['text_primary'],
                              bg=self.colors['bg_tertiary'])
        status_title.place(x=10, y=5)

        self.status_label = tk.Label(status_indicator_frame,
                                   text="🟢 Ready - Show your hand gesture",
                                   font=("Segoe UI", 11),
                                   fg=self.colors['success'],
                                   bg=self.colors['bg_tertiary'])
        self.status_label.place(x=10, y=30)





        self.str = " "
        self.ccc=0
        self.word = " "
        self.current_symbol = "C"
        self.photo = "Empty"


        self.word1=" "
        self.word2 = " "
        self.word3 = " "
        self.word4 = " "
        
        # Gallery processing variables
        self.current_mode = "camera"  # "camera", "image", "video"
        self.video_capture = None
        self.current_frame = 0
        self.total_frames = 0
        self.is_processing_video = False

        self.video_loop()

    def video_loop(self):
        try:
            # Only process camera feed if in camera mode
            if self.current_mode == "camera":
                ok, frame = self.vs.read()
                if ok:
                    cv2image = cv2.flip(frame, 1)
                    if cv2image.any():
                        hands = hd.findHands(cv2image, draw=False, flipType=True)
                        cv2image_copy = np.array(cv2image)
                        cv2image = cv2.cvtColor(cv2image, cv2.COLOR_BGR2RGB)
                        self.current_image = Image.fromarray(cv2image)
                        imgtk = ImageTk.PhotoImage(image=self.current_image)
                        self.panel.imgtk = imgtk
                        self.panel.config(image=imgtk)

                        if hands and len(hands) > 0:
                            # Update status to show hand detected
                            self.status_label.config(text="🟡 Hand Detected - Processing...", fg=self.colors['warning'])
                            
                            hand = hands[0]
                            if len(hand) > 0:
                                map = hand[0]
                                x, y, w, h = map['bbox']
                                image = cv2image_copy[y - offset:y + h + offset, x - offset:x + w + offset]

                                white = cv2.imread("white.jpg")
                                # img_final=img_final1=img_final2=0
                                if white is not None and image.any():
                                    handz = hd2.findHands(image, draw=False, flipType=True)
                                    self.ccc += 1
                                    if handz and len(handz) > 0 and len(handz[0]) > 0:
                                        # Update status to show processing
                                        self.status_label.config(text="🟢 Processing Hand Gesture...", fg=self.colors['success'])
                                        hand = handz[0]
                                        handmap = hand[0]
                                        self.pts = handmap['lmList']
                                        # x1,y1,w1,h1=hand['bbox']

                                        os = ((400 - w) // 2) - 15
                                        os1 = ((400 - h) // 2) - 15
                                        
                                        # Draw hand skeleton
                                        self.draw_hand_skeleton(white, self.pts, os, os1)

                                        res = white
                                        self.predict(res)

                                        self.current_image2 = Image.fromarray(res)
                                        imgtk2 = ImageTk.PhotoImage(image=self.current_image2)
                                        self.panel2.imgtk = imgtk2
                                        self.panel2.config(image=imgtk2)

                                        self.panel3.config(text=self.current_symbol, font=("Segoe UI", 24, "bold"))

                                        self.b1.config(text=self.word1, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action1)
                                        self.b2.config(text=self.word2, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action2)
                                        self.b3.config(text=self.word3, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action3)
                                        self.b4.config(text=self.word4, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action4)

                                        self.panel5.config(text=self.str, font=("Segoe UI", 18), wraplength=800)
                        else:
                            # No hand detected
                            self.status_label.config(text="🟡 Show your hand to the camera", fg=self.colors['warning'])
        except Exception:
            print(Exception.__traceback__)
            hands = hd.findHands(cv2image, draw=False, flipType=True)
            cv2image_copy=np.array(cv2image)
            cv2image = cv2.cvtColor(cv2image, cv2.COLOR_BGR2RGB)
            self.current_image = Image.fromarray(cv2image)
            imgtk = ImageTk.PhotoImage(image=self.current_image)
            self.panel.imgtk = imgtk
            self.panel.config(image=imgtk)

            if hands:
                # #print(" --------- lmlist=",hands[1])
                hand = hands[0]
                x, y, w, h = hand['bbox']
                image = cv2image_copy[y - offset:y + h + offset, x - offset:x + w + offset]

                white = cv2.imread("C:\\Users\\devansh raval\\PycharmProjects\\pythonProject\\white.jpg")
                # img_final=img_final1=img_final2=0

                handz = hd2.findHands(image, draw=False, flipType=True)
                print(" ", self.ccc)
                self.ccc += 1
                if handz:
                    hand = handz[0]
                    self.pts = hand['lmList']
                    # x1,y1,w1,h1=hand['bbox']

                    os = ((400 - w) // 2) - 15
                    os1 = ((400 - h) // 2) - 15
                    for t in range(0, 4, 1):
                        cv2.line(white, (self.pts[t][0] + os, self.pts[t][1] + os1), (self.pts[t + 1][0] + os, self.pts[t + 1][1] + os1),
                                 (0, 255, 0), 3)
                    for t in range(5, 8, 1):
                        cv2.line(white, (self.pts[t][0] + os, self.pts[t][1] + os1), (self.pts[t + 1][0] + os, self.pts[t + 1][1] + os1),
                                 (0, 255, 0), 3)
                    for t in range(9, 12, 1):
                        cv2.line(white, (self.pts[t][0] + os, self.pts[t][1] + os1), (self.pts[t + 1][0] + os, self.pts[t + 1][1] + os1),
                                 (0, 255, 0), 3)
                    for t in range(13, 16, 1):
                        cv2.line(white, (self.pts[t][0] + os, self.pts[t][1] + os1), (self.pts[t + 1][0] + os, self.pts[t + 1][1] + os1),
                                 (0, 255, 0), 3)
                    for t in range(17, 20, 1):
                        cv2.line(white, (self.pts[t][0] + os, self.pts[t][1] + os1), (self.pts[t + 1][0] + os, self.pts[t + 1][1] + os1),
                                 (0, 255, 0), 3)
                    cv2.line(white, (self.pts[5][0] + os, self.pts[5][1] + os1), (self.pts[9][0] + os, self.pts[9][1] + os1), (0, 255, 0),
                             3)
                    cv2.line(white, (self.pts[9][0] + os, self.pts[9][1] + os1), (self.pts[13][0] + os, self.pts[13][1] + os1), (0, 255, 0),
                             3)
                    cv2.line(white, (self.pts[13][0] + os, self.pts[13][1] + os1), (self.pts[17][0] + os, self.pts[17][1] + os1),
                             (0, 255, 0), 3)
                    cv2.line(white, (self.pts[0][0] + os, self.pts[0][1] + os1), (self.pts[5][0] + os, self.pts[5][1] + os1), (0, 255, 0),
                             3)
                    cv2.line(white, (self.pts[0][0] + os, self.pts[0][1] + os1), (self.pts[17][0] + os, self.pts[17][1] + os1), (0, 255, 0),
                             3)

                    for i in range(21):
                        cv2.circle(white, (self.pts[i][0] + os, self.pts[i][1] + os1), 2, (0, 0, 255), 1)

                    res=white
                    self.predict(res)

                    self.current_image2 = Image.fromarray(res)

                    imgtk = ImageTk.PhotoImage(image=self.current_image2)

                    self.panel2.imgtk = imgtk
                    self.panel2.config(image=imgtk)

                    self.panel3.config(text=self.current_symbol, font=("Courier", 30))

                    #self.panel4.config(text=self.word, font=("Courier", 30))



                    self.b1.config(text=self.word1, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action1)
                    self.b2.config(text=self.word2, font=("Segoe UI", 12, "bold"), wraplength=160,  command=self.action2)
                    self.b3.config(text=self.word3, font=("Segoe UI", 12, "bold"), wraplength=160,  command=self.action3)
                    self.b4.config(text=self.word4, font=("Segoe UI", 12, "bold"), wraplength=160,  command=self.action4)

            self.panel5.config(text=self.str, font=("Segoe UI", 18), wraplength=800)
        except Exception:
            print("==", traceback.format_exc())
        finally:
            self.root.after(1, self.video_loop)

    def distance(self,x,y):
        return math.sqrt(((x[0] - y[0]) ** 2) + ((x[1] - y[1]) ** 2))

    def action1(self):
        idx_space = self.str.rfind(" ")
        idx_word = self.str.find(self.word, idx_space)
        last_idx = len(self.str)
        self.str = self.str[:idx_word]
        self.str = self.str + self.word1.upper()


    def action2(self):
        idx_space = self.str.rfind(" ")
        idx_word = self.str.find(self.word, idx_space)
        last_idx = len(self.str)
        self.str=self.str[:idx_word]
        self.str=self.str+self.word2.upper()
        #self.str[idx_word:last_idx] = self.word2


    def action3(self):
        idx_space = self.str.rfind(" ")
        idx_word = self.str.find(self.word, idx_space)
        last_idx = len(self.str)
        self.str = self.str[:idx_word]
        self.str = self.str + self.word3.upper()



    def action4(self):
        idx_space = self.str.rfind(" ")
        idx_word = self.str.find(self.word, idx_space)
        last_idx = len(self.str)
        self.str = self.str[:idx_word]
        self.str = self.str + self.word4.upper()


    def speak_fun(self):
        self.speak_engine.say(self.str)
        self.speak_engine.runAndWait()


    def clear_fun(self):
        self.str=" "
        self.word1 = " "
        self.word2 = " "
        self.word3 = " "
        self.word4 = " "
        
        # Clear displays
        self.panel3.config(text="", font=("Segoe UI", 24, "bold"))
        self.panel5.config(text="", font=("Segoe UI", 18), wraplength=800)
        
        # Clear word suggestions
        self.b1.config(text="", font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action1)
        self.b2.config(text="", font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action2)
        self.b3.config(text="", font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action3)
        self.b4.config(text="", font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action4)
        
        # Clear hand skeleton display
        if hasattr(self, 'current_image2'):
            # Create empty white image
            white = cv2.imread("white.jpg")
            if white is not None:
                self.current_image2 = Image.fromarray(white)
                imgtk2 = ImageTk.PhotoImage(image=self.current_image2)
                self.panel2.imgtk = imgtk2
                self.panel2.config(image=imgtk2)
        
        # Update status
        if self.current_mode == "camera":
            self.status_label.config(text="🟢 Screen Cleared - Show your hand", fg=self.colors['success'])
        elif self.current_mode == "image":
            self.status_label.config(text="🟢 Screen Cleared - Load new image", fg=self.colors['success'])
        elif self.current_mode == "building":
            self.status_label.config(text="🟢 Building Mode Cleared - Start building again", fg=self.colors['success'])
            # Reset to normal mode
            self.current_mode = "camera"
            self.load_image.place(x=30, y=220, width=150, height=35)
            self.load_multiple_images.place(x=200, y=220, width=150, height=35)
            self.start_building.place(x=200, y=265, width=150, height=35)
            self.load_next_image.place_forget()
            self.use_sentence.place_forget()
            self.clear_last_char.place_forget()

    def load_image_from_gallery(self):
        """Load image from gallery and process it"""
        file_path = filedialog.askopenfilename(
            title="Select Image",
            filetypes=[("Image files", "*.jpg *.jpeg *.png *.bmp *.tiff")]
        )
        
        if file_path:
            self.current_mode = "image"
            # Hide video control buttons if they're visible
            self.play_video.place_forget()
            self.stop_video.place_forget()
            
            self.status_label.config(text="🟡 Processing Image...", fg=self.colors['warning'])
            self.process_image_file(file_path)

    def load_multiple_images_from_gallery(self):
        """Load multiple images from gallery for sentence building"""
        file_paths = filedialog.askopenfilenames(
            title="Select Multiple Images",
            filetypes=[("Image files", "*.jpg *.jpeg *.png *.bmp *.tiff")]
        )
        
        if file_paths:
            self.current_mode = "image"
            # Hide video control buttons if they're visible
            self.play_video.place_forget()
            self.stop_video.place_forget()
            
            # Clear previous sentence
            self.str = ""
            self.panel5.config(text="", font=("Segoe UI", 18), wraplength=800)
            
            self.status_label.config(text=f"🟡 Processing {len(file_paths)} images...", fg=self.colors['warning'])
            self.process_multiple_images(file_paths)

    def process_multiple_images(self, file_paths):
        """Process multiple images to build a sentence"""
        try:
            for i, image_path in enumerate(file_paths):
                self.status_label.config(text=f"🟡 Processing image {i+1}/{len(file_paths)}...", fg=self.colors['warning'])
                self.root.update()
                
                # Load and resize image
                img = cv2.imread(image_path)
                if img is None:
                    continue
                    
                img = cv2.resize(img, (640, 480))
                
                # Display current image
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                self.current_image = Image.fromarray(img_rgb)
                imgtk = ImageTk.PhotoImage(image=self.current_image)
                self.panel.imgtk = imgtk
                self.panel.config(image=imgtk)
                
                # Detect hands
                hands, img = self.detector.findHands(img, draw=False)
                
                if hands:
                    hand = hands[0]
                    lmList = hand["lmList"]
                    
                    if len(lmList) == 21:
                        # Draw hand skeleton on white background
                        white = np.ones((480, 640, 3), dtype=np.uint8) * 255
                        self.draw_hand_skeleton(white, lmList, hand["bbox"], hand["center"])
                        
                        # Display skeleton
                        res = cv2.resize(white, (640, 480))
                        self.current_image2 = Image.fromarray(res)
                        imgtk2 = ImageTk.PhotoImage(image=self.current_image2)
                        self.panel2.imgtk = imgtk2
                        self.panel2.config(image=imgtk2)
                        
                        # Predict character
                        self.predict(res)
                        
                        # Force UI update
                        self.root.update()
                        
                        # Update character display
                        self.panel3.config(text=self.current_symbol, font=("Segoe UI", 24, "bold"))
                        
                        # Update word suggestions
                        self.b1.config(text=self.word1, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action1)
                        self.b2.config(text=self.word2, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action2)
                        self.b3.config(text=self.word3, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action3)
                        self.b4.config(text=self.word4, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action4)
                        
                        # Update sentence display
                        self.panel5.config(text=self.str, font=("Segoe UI", 18), wraplength=800)
                        
                        # Force UI update again
                        self.root.update()
                        
                        # Show clear gallery button
                        self.clear_gallery.place(x=30, y=355, width=320, height=35)
                        
                        self.status_label.config(text=f"🟢 Image {i+1}/{len(file_paths)} - Character: {self.current_symbol}", fg=self.colors['success'])
                    else:
                        self.status_label.config(text=f"🟡 Image {i+1}/{len(file_paths)} - Invalid hand landmarks", fg=self.colors['warning'])
                else:
                    self.status_label.config(text=f"🟡 Image {i+1}/{len(file_paths)} - No hand detected", fg=self.colors['warning'])
                
                # Small delay between images
                self.root.after(500)
                
            self.status_label.config(text=f"🟢 Completed! Processed {len(file_paths)} images. Sentence: {self.str}", fg=self.colors['success'])
            
            # Show Use Sentence button
            self.use_sentence.place(x=30, y=400, width=320, height=35)
            
        except Exception as e:
            print(f"Error processing multiple images: {e}")
            self.status_label.config(text="🔴 Error processing images", fg=self.colors['accent'])

    def use_current_sentence(self):
        """Apply the current sentence to the main text area"""
        if self.str:
            # Copy sentence to main text area
            self.panel5.config(text=self.str, font=("Segoe UI", 18), wraplength=800)
            
            # Update word suggestions based on the sentence
            words = self.str.split()
            if len(words) >= 1:
                self.b1.config(text=words[0], font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action1)
            if len(words) >= 2:
                self.b2.config(text=words[1], font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action2)
            if len(words) >= 3:
                self.b3.config(text=words[2], font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action3)
            if len(words) >= 4:
                self.b4.config(text=words[3], font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action4)
            
            self.status_label.config(text=f"✅ Sentence Applied: {self.str}", fg=self.colors['success'])
            
            # Hide the Use Sentence button
            self.use_sentence.place_forget()
        else:
            self.status_label.config(text="🔴 No sentence to apply", fg=self.colors['accent'])

    def start_sentence_building(self):
        """Start step-by-step sentence building mode"""
        self.current_mode = "building"
        self.str = ""  # Clear current sentence
        self.panel5.config(text="", font=("Segoe UI", 18), wraplength=800)
        
        # Hide other buttons and show building controls
        self.load_image.place_forget()
        self.load_multiple_images.place_forget()
        self.start_building.place_forget()
        
        # Show building controls
        self.load_next_image.place(x=30, y=265, width=150, height=35)
        self.use_sentence.place(x=200, y=265, width=150, height=35)
        self.clear_last_char.place(x=30, y=310, width=150, height=35)
        
        self.status_label.config(text="🏗️ Building Mode: Load images one by one to build your sentence", fg=self.colors['success'])

    def load_next_image_for_sentence(self):
        """Load next image for step-by-step sentence building"""
        file_path = filedialog.askopenfilename(
            title="Select Next Image for Sentence Building",
            filetypes=[("Image files", "*.jpg *.jpeg *.png *.bmp *.tiff")]
        )
        
        if file_path:
            self.status_label.config(text="🟡 Processing image for sentence building...", fg=self.colors['warning'])
            self.process_image_for_sentence(file_path)
        else:
            self.status_label.config(text="🔴 No image selected", fg=self.colors['accent'])

    def process_image_for_sentence(self, image_path):
        """Process a single image and add to sentence"""
        try:
            # Load image
            img = cv2.imread(image_path)
            if img is None:
                self.status_label.config(text="🔴 Error: Could not load image", fg=self.colors['accent'])
                return
                
            img = cv2.resize(img, (640, 480))
            
            # Display image
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            self.current_image = Image.fromarray(img_rgb)
            imgtk = ImageTk.PhotoImage(image=self.current_image)
            self.panel.imgtk = imgtk
            self.panel.config(image=imgtk)
            
            # Detect hands
            hands, img = self.detector.findHands(img, draw=False)
            
            if hands:
                hand = hands[0]
                lmList = hand["lmList"]
                
                if len(lmList) == 21:
                    # Draw hand skeleton on white background
                    white = np.ones((480, 640, 3), dtype=np.uint8) * 255
                    self.draw_hand_skeleton(white, lmList, hand["bbox"], hand["center"])
                    
                    # Display skeleton
                    res = cv2.resize(white, (640, 480))
                    self.current_image2 = Image.fromarray(res)
                    imgtk2 = ImageTk.PhotoImage(image=self.current_image2)
                    self.panel2.imgtk = imgtk2
                    self.panel2.config(image=imgtk2)
                    
                    # Store previous sentence length
                    prev_length = len(self.str)
                    
                    # Predict character
                    self.predict(res)
                    
                    # Check if a new character was added
                    new_char = self.current_symbol
                    if len(self.str) > prev_length:
                        # Character was added to sentence
                        self.status_label.config(text=f"✅ Added '{new_char}' to sentence. Current: {self.str}", fg=self.colors['success'])
                    else:
                        # Character was not added, add it manually for building mode
                        if new_char and new_char != " " and new_char != "next":
                            self.str += new_char
                            self.status_label.config(text=f"✅ Added '{new_char}' to sentence. Current: {self.str}", fg=self.colors['success'])
                        else:
                            self.status_label.config(text=f"⚠️ Character '{new_char}' not added. Current: {self.str}", fg=self.colors['warning'])
                    
                    # Force UI update
                    self.root.update()
                    
                    # Update character display
                    self.panel3.config(text=self.current_symbol, font=("Segoe UI", 24, "bold"))
                    
                    # Update word suggestions
                    self.b1.config(text=self.word1, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action1)
                    self.b2.config(text=self.word2, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action2)
                    self.b3.config(text=self.word3, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action3)
                    self.b4.config(text=self.word4, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action4)
                    
                    # Update sentence display
                    self.panel5.config(text=self.str, font=("Segoe UI", 18), wraplength=800)
                    
                    # Force UI update again
                    self.root.update()
                else:
                    self.status_label.config(text="🔴 Invalid hand landmarks detected", fg=self.colors['accent'])
            else:
                self.status_label.config(text="🔴 No hand detected in image", fg=self.colors['accent'])
                
        except Exception as e:
            print(f"Error processing image for sentence: {e}")
            self.status_label.config(text=f"🔴 Error: {str(e)}", fg=self.colors['accent'])

    def clear_last_character(self):
        """Remove the last character from the sentence in building mode"""
        if self.str and len(self.str) > 0:
            self.str = self.str[:-1]  # Remove last character
            self.panel5.config(text=self.str, font=("Segoe UI", 18), wraplength=800)
            self.status_label.config(text=f"⌫ Removed last character. Current: {self.str}", fg=self.colors['success'])
        else:
            self.status_label.config(text="🔴 No characters to remove", fg=self.colors['accent'])

    def load_video_from_gallery(self):
        """Load video from gallery and prepare for processing"""
        file_path = filedialog.askopenfilename(
            title="Select Video",
            filetypes=[("Video files", "*.mp4 *.avi *.mov *.mkv *.wmv")]
        )
        
        if file_path:
            self.current_mode = "video"
            self.video_capture = cv2.VideoCapture(file_path)
            self.total_frames = int(self.video_capture.get(cv2.CAP_PROP_FRAME_COUNT))
            self.current_frame = 0
            self.is_processing_video = False
            
            # Clear previous displays
            self.panel3.config(text="", font=("Segoe UI", 24, "bold"))
            self.panel5.config(text="", font=("Segoe UI", 18), wraplength=800)
            
            # Show video control buttons
            self.play_video.place(x=30, y=310, width=150, height=35)
            self.stop_video.place(x=200, y=310, width=150, height=35)
            
            self.status_label.config(text="🟢 Video Loaded - Click Play to Process", fg=self.colors['success'])

    def process_image_file(self, image_path):
        """Process a single image file for hand detection"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                self.status_label.config(text="🔴 Error: Could not load image", fg=self.colors['accent'])
                return
            
            # Resize image to fit display
            height, width = image.shape[:2]
            max_width, max_height = 500, 400
            if width > max_width or height > max_height:
                scale = min(max_width/width, max_height/height)
                new_width = int(width * scale)
                new_height = int(height * scale)
                image = cv2.resize(image, (new_width, new_height))
            
            # Convert to RGB for display
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            self.current_image = Image.fromarray(image_rgb)
            imgtk = ImageTk.PhotoImage(image=self.current_image)
            self.panel.imgtk = imgtk
            self.panel.config(image=imgtk)
            
            # Update UI immediately
            self.root.update()
            
            # Detect hands in the image
            hands = hd.findHands(image, draw=False, flipType=True)
            print(f"Hands detected: {len(hands) if hands else 0}")
            
            if hands and len(hands) > 0:
                hand = hands[0]
                map = hand[0]
                x, y, w, h = map['bbox']
                
                # Extract hand region with bounds checking
                y_start = max(0, y - offset)
                y_end = min(image.shape[0], y + h + offset)
                x_start = max(0, x - offset)
                x_end = min(image.shape[1], x + w + offset)
                
                hand_image = image[y_start:y_end, x_start:x_end]
                
                if hand_image.size > 0:
                    # Process hand landmarks
                    handz = hd2.findHands(hand_image, draw=False, flipType=True)
                    print(f"Hand landmarks detected: {len(handz) if handz else 0}")
                    
                    if handz and len(handz) > 0 and len(handz[0]) > 0:
                        hand_data = handz[0]
                        handmap = hand_data[0]
                        self.pts = handmap['lmList']
                        
                        # Create hand skeleton visualization
                        white = cv2.imread("white.jpg")
                        if white is not None:
                            # Calculate offsets for centering
                            os = ((400 - w) // 2) - 15
                            os1 = ((400 - h) // 2) - 15
                            
                            # Draw hand skeleton
                            self.draw_hand_skeleton(white, self.pts, os, os1)
                            
                            # Display skeleton
                            res = white
                            self.current_image2 = Image.fromarray(res)
                            imgtk2 = ImageTk.PhotoImage(image=self.current_image2)
                            self.panel2.imgtk = imgtk2
                            self.panel2.config(image=imgtk2)
                            
                            # Predict character
                            self.predict(res)
                            
                            # Force UI update
                            self.root.update()
                            
                            # Update character display
                            self.panel3.config(text=self.current_symbol, font=("Segoe UI", 24, "bold"))
                            
                            # Update word suggestions
                            self.b1.config(text=self.word1, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action1)
                            self.b2.config(text=self.word2, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action2)
                            self.b3.config(text=self.word3, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action3)
                            self.b4.config(text=self.word4, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action4)
                            
                            # Update sentence display
                            self.panel5.config(text=self.str, font=("Segoe UI", 18), wraplength=800)
                            
                            # Force UI update again
                            self.root.update()
                            
                            # Show clear gallery button
                            self.clear_gallery.place(x=30, y=355, width=320, height=35)
                            
                            self.status_label.config(text=f"🟢 Image Processed - Character: {self.current_symbol}", fg=self.colors['success'])
                        else:
                            self.status_label.config(text="🔴 Error: White background not found", fg=self.colors['accent'])
                    else:
                        self.status_label.config(text="🔴 No hand landmarks detected", fg=self.colors['accent'])
                else:
                    self.status_label.config(text="🔴 Invalid hand region", fg=self.colors['accent'])
            else:
                self.status_label.config(text="🔴 No hand detected in image", fg=self.colors['accent'])
                # Show clear gallery button even if no hand detected
                self.clear_gallery.place(x=30, y=355, width=320, height=35)
                
        except Exception as e:
            self.status_label.config(text=f"🔴 Error: {str(e)}", fg=self.colors['accent'])
            print(f"Error processing image: {e}")
            import traceback
            traceback.print_exc()
            # Show clear gallery button even on error
            self.clear_gallery.place(x=30, y=355, width=320, height=35)

    def play_video_processing(self):
        """Start video processing"""
        if self.video_capture is not None:
            self.is_processing_video = True
            self.status_label.config(text="🟡 Processing Video...", fg=self.colors['warning'])
            self.process_video_frames()

    def stop_video_processing(self):
        """Stop video processing"""
        self.is_processing_video = False
        if self.video_capture is not None:
            self.video_capture.release()
        self.status_label.config(text="🟢 Video Processing Stopped", fg=self.colors['success'])

    def switch_to_camera_mode(self):
        """Switch back to camera mode"""
        self.current_mode = "camera"
        # Hide gallery mode buttons
        self.play_video.place_forget()
        self.stop_video.place_forget()
        self.clear_gallery.place_forget()
        # Reset video capture
        if self.video_capture is not None:
            self.video_capture.release()
            self.video_capture = None
        self.is_processing_video = False
        self.status_label.config(text="🟢 Switched to Camera Mode", fg=self.colors['success'])

    def clear_gallery_display(self):
        """Clear gallery display and reset to empty state"""
        # Clear all text and displays
        self.clear_fun()
        
        # Clear the main display panel
        if self.current_mode == "image":
            # Show empty panel for image mode
            empty_image = np.zeros((400, 500, 3), dtype=np.uint8)
            empty_image.fill(50)  # Dark gray
            self.current_image = Image.fromarray(empty_image)
            imgtk = ImageTk.PhotoImage(image=self.current_image)
            self.panel.imgtk = imgtk
            self.panel.config(image=imgtk)
            self.status_label.config(text="🟢 Gallery Cleared - Load new image", fg=self.colors['success'])
        elif self.current_mode == "video":
            # Show empty panel for video mode
            empty_image = np.zeros((400, 500, 3), dtype=np.uint8)
            empty_image.fill(50)  # Dark gray
            self.current_image = Image.fromarray(empty_image)
            imgtk = ImageTk.PhotoImage(image=self.current_image)
            self.panel.imgtk = imgtk
            self.panel.config(image=imgtk)
            self.status_label.config(text="🟢 Gallery Cleared - Load new video", fg=self.colors['success'])

    def process_video_frames(self):
        """Process video frames for hand detection"""
        if not self.is_processing_video or self.video_capture is None:
            return
        
        ret, frame = self.video_capture.read()
        if not ret:
            self.is_processing_video = False
            self.status_label.config(text="🟢 Video Processing Complete", fg=self.colors['success'])
            return
        
        self.current_frame += 1
        
        # Process every 10th frame for much better performance (was every 5th)
        if self.current_frame % 10 == 0:
            # Resize frame for much faster processing (even smaller size)
            frame = cv2.resize(frame, (160, 120))
            
            # Display current frame
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            self.current_image = Image.fromarray(frame_rgb)
            imgtk = ImageTk.PhotoImage(image=self.current_image)
            self.panel.imgtk = imgtk
            self.panel.config(image=imgtk)
            
            # Detect hands
            hands = hd.findHands(frame, draw=False, flipType=True)
            
            if hands and len(hands) > 0:
                hand = hands[0]
                map = hand[0]
                x, y, w, h = map['bbox']
                
                # Extract hand region with bounds checking
                y_start = max(0, y - offset)
                y_end = min(frame.shape[0], y + h + offset)
                x_start = max(0, x - offset)
                x_end = min(frame.shape[1], x + w + offset)
                
                hand_image = frame[y_start:y_end, x_start:x_end]
                
                if hand_image.size > 0:
                    # Process hand landmarks
                    handz = hd2.findHands(hand_image, draw=False, flipType=True)
                    
                    if handz and len(handz) > 0 and len(handz[0]) > 0:
                        hand_data = handz[0]
                        handmap = hand_data[0]
                        self.pts = handmap['lmList']
                        
                        # Create hand skeleton visualization
                        white = cv2.imread("white.jpg")
                        if white is not None:
                            os = ((400 - w) // 2) - 15
                            os1 = ((400 - h) // 2) - 15
                            
                            # Draw hand skeleton
                            self.draw_hand_skeleton(white, self.pts, os, os1)
                            
                            # Display skeleton
                            res = white
                            self.current_image2 = Image.fromarray(res)
                            imgtk2 = ImageTk.PhotoImage(image=self.current_image2)
                            self.panel2.imgtk = imgtk2
                            self.panel2.config(image=imgtk2)
                            
                            # Predict character
                            self.predict(res)
                            
                            # Force UI update
                            self.root.update()
                            
                            # Update character display
                            self.panel3.config(text=self.current_symbol, font=("Segoe UI", 24, "bold"))
                            
                            # Update word suggestions
                            self.b1.config(text=self.word1, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action1)
                            self.b2.config(text=self.word2, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action2)
                            self.b3.config(text=self.word3, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action3)
                            self.b4.config(text=self.word4, font=("Segoe UI", 12, "bold"), wraplength=160, command=self.action4)
                            
                            # Update sentence display
                            self.panel5.config(text=self.str, font=("Segoe UI", 18), wraplength=800)
                            
                            # Force UI update again
                            self.root.update()
                            
                            # Update status
                            self.status_label.config(text=f"🟢 Frame {self.current_frame}/{self.total_frames} - Character: {self.current_symbol}", fg=self.colors['success'])
                    else:
                        # No hand landmarks detected in this frame
                        self.status_label.config(text=f"🟡 Frame {self.current_frame}/{self.total_frames} - No hand detected", fg=self.colors['warning'])
                else:
                    # Invalid hand region
                    self.status_label.config(text=f"🟡 Frame {self.current_frame}/{self.total_frames} - Invalid hand region", fg=self.colors['warning'])
            else:
                # No hand detected in this frame
                self.status_label.config(text=f"🟡 Frame {self.current_frame}/{self.total_frames} - No hand detected", fg=self.colors['warning'])
        
        # Continue processing after a short delay
        if self.is_processing_video:
            self.root.after(25, self.process_video_frames)  # Process at ~40fps (much faster)

    def draw_hand_skeleton(self, white, pts, os, os1):
        """Draw hand skeleton on white background"""
        # Draw finger connections
        for t in range(0, 4, 1):
            cv2.line(white, (pts[t][0] + os, pts[t][1] + os1), (pts[t + 1][0] + os, pts[t + 1][1] + os1),
                     (0, 255, 0), 3)
        for t in range(5, 8, 1):
            cv2.line(white, (pts[t][0] + os, pts[t][1] + os1), (pts[t + 1][0] + os, pts[t + 1][1] + os1),
                     (0, 255, 0), 3)
        for t in range(9, 12, 1):
            cv2.line(white, (pts[t][0] + os, pts[t][1] + os1), (pts[t + 1][0] + os, pts[t + 1][1] + os1),
                     (0, 255, 0), 3)
        for t in range(13, 16, 1):
            cv2.line(white, (pts[t][0] + os, pts[t][1] + os1), (pts[t + 1][0] + os, pts[t + 1][1] + os1),
                     (0, 255, 0), 3)
        for t in range(17, 20, 1):
            cv2.line(white, (pts[t][0] + os, pts[t][1] + os1), (pts[t + 1][0] + os, pts[t + 1][1] + os1),
                     (0, 255, 0), 3)
        
        # Draw palm connections
        cv2.line(white, (pts[5][0] + os, pts[5][1] + os1), (pts[9][0] + os, pts[9][1] + os1), (0, 255, 0), 3)
        cv2.line(white, (pts[9][0] + os, pts[9][1] + os1), (pts[13][0] + os, pts[13][1] + os1), (0, 255, 0), 3)
        cv2.line(white, (pts[13][0] + os, pts[13][1] + os1), (pts[17][0] + os, pts[17][1] + os1), (0, 255, 0), 3)
        cv2.line(white, (pts[0][0] + os, pts[0][1] + os1), (pts[5][0] + os, pts[5][1] + os1), (0, 255, 0), 3)
        cv2.line(white, (pts[0][0] + os, pts[0][1] + os1), (pts[17][0] + os, pts[17][1] + os1), (0, 255, 0), 3)
        
        # Draw landmarks
        for i in range(21):
            cv2.circle(white, (pts[i][0] + os, pts[i][1] + os1), 2, (0, 0, 255), 1)

    def predict(self, test_image):
        white=test_image
        white = white.reshape(1, 400, 400, 3)
        prob = np.array(self.model.predict(white)[0], dtype='float32')
        ch1 = np.argmax(prob, axis=0)
        prob[ch1] = 0
        ch2 = np.argmax(prob, axis=0)
        prob[ch2] = 0
        ch3 = np.argmax(prob, axis=0)
        prob[ch3] = 0

        pl = [ch1, ch2]

        # condition for [Aemnst]
        l = [[5, 2], [5, 3], [3, 5], [3, 6], [3, 0], [3, 2], [6, 4], [6, 1], [6, 2], [6, 6], [6, 7], [6, 0], [6, 5],
             [4, 1], [1, 0], [1, 1], [6, 3], [1, 6], [5, 6], [5, 1], [4, 5], [1, 4], [1, 5], [2, 0], [2, 6], [4, 6],
             [1, 0], [5, 7], [1, 6], [6, 1], [7, 6], [2, 5], [7, 1], [5, 4], [7, 0], [7, 5], [7, 2]]
        if pl in l:
            if (self.pts[6][1] < self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] < self.pts[20][
                1]):
                ch1 = 0

        # condition for [o][s]
        l = [[2, 2], [2, 1]]
        if pl in l:
            if (self.pts[5][0] < self.pts[4][0]):
                ch1 = 0
                print("++++++++++++++++++")
                # print("00000")

        # condition for [c0][aemnst]
        l = [[0, 0], [0, 6], [0, 2], [0, 5], [0, 1], [0, 7], [5, 2], [7, 6], [7, 1]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[0][0] > self.pts[8][0] and self.pts[0][0] > self.pts[4][0] and self.pts[0][0] > self.pts[12][0] and self.pts[0][0] > self.pts[16][
                0] and self.pts[0][0] > self.pts[20][0]) and self.pts[5][0] > self.pts[4][0]:
                ch1 = 2

        # condition for [c0][aemnst]
        l = [[6, 0], [6, 6], [6, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if self.distance(self.pts[8], self.pts[16]) < 52:
                ch1 = 2


        # condition for [gh][bdfikruvw]
        l = [[1, 4], [1, 5], [1, 6], [1, 3], [1, 0]]
        pl = [ch1, ch2]

        if pl in l:
            if self.pts[6][1] > self.pts[8][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] < self.pts[20][1] and self.pts[0][0] < self.pts[8][
                0] and self.pts[0][0] < self.pts[12][0] and self.pts[0][0] < self.pts[16][0] and self.pts[0][0] < self.pts[20][0]:
                ch1 = 3



        # con for [gh][l]
        l = [[4, 6], [4, 1], [4, 5], [4, 3], [4, 7]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[4][0] > self.pts[0][0]:
                ch1 = 3

        # con for [gh][pqz]
        l = [[5, 3], [5, 0], [5, 7], [5, 4], [5, 2], [5, 1], [5, 5]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[2][1] + 15 < self.pts[16][1]:
                ch1 = 3

        # con for [l][x]
        l = [[6, 4], [6, 1], [6, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if self.distance(self.pts[4], self.pts[11]) > 55:
                ch1 = 4

        # con for [l][d]
        l = [[1, 4], [1, 6], [1, 1]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.distance(self.pts[4], self.pts[11]) > 50) and (
                    self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] <
                    self.pts[20][1]):
                ch1 = 4

        # con for [l][gh]
        l = [[3, 6], [3, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[4][0] < self.pts[0][0]):
                ch1 = 4

        # con for [l][c0]
        l = [[2, 2], [2, 5], [2, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[1][0] < self.pts[12][0]):
                ch1 = 4

        # con for [l][c0]
        l = [[2, 2], [2, 5], [2, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[1][0] < self.pts[12][0]):
                ch1 = 4

        # con for [gh][z]
        l = [[3, 6], [3, 5], [3, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] < self.pts[20][
                1]) and self.pts[4][1] > self.pts[10][1]:
                ch1 = 5

        # con for [gh][pq]
        l = [[3, 2], [3, 1], [3, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[4][1] + 17 > self.pts[8][1] and self.pts[4][1] + 17 > self.pts[12][1] and self.pts[4][1] + 17 > self.pts[16][1] and self.pts[4][
                1] + 17 > self.pts[20][1]:
                ch1 = 5

        # con for [l][pqz]
        l = [[4, 4], [4, 5], [4, 2], [7, 5], [7, 6], [7, 0]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[4][0] > self.pts[0][0]:
                ch1 = 5

        # con for [pqz][aemnst]
        l = [[0, 2], [0, 6], [0, 1], [0, 5], [0, 0], [0, 7], [0, 4], [0, 3], [2, 7]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[0][0] < self.pts[8][0] and self.pts[0][0] < self.pts[12][0] and self.pts[0][0] < self.pts[16][0] and self.pts[0][0] < self.pts[20][0]:
                ch1 = 5

        # con for [pqz][yj]
        l = [[5, 7], [5, 2], [5, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[3][0] < self.pts[0][0]:
                ch1 = 7

        # con for [l][yj]
        l = [[4, 6], [4, 2], [4, 4], [4, 1], [4, 5], [4, 7]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[6][1] < self.pts[8][1]:
                ch1 = 7

        # con for [x][yj]
        l = [[6, 7], [0, 7], [0, 1], [0, 0], [6, 4], [6, 6], [6, 5], [6, 1]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[18][1] > self.pts[20][1]:
                ch1 = 7

        # condition for [x][aemnst]
        l = [[0, 4], [0, 2], [0, 3], [0, 1], [0, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[5][0] > self.pts[16][0]:
                ch1 = 6


        # condition for [yj][x]
        print("2222  ch1=+++++++++++++++++", ch1, ",", ch2)
        l = [[7, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[18][1] < self.pts[20][1] and self.pts[8][1] < self.pts[10][1]:
                ch1 = 6

        # condition for [c0][x]
        l = [[2, 1], [2, 2], [2, 6], [2, 7], [2, 0]]
        pl = [ch1, ch2]
        if pl in l:
            if self.distance(self.pts[8], self.pts[16]) > 50:
                ch1 = 6

        # con for [l][x]

        l = [[4, 6], [4, 2], [4, 1], [4, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if self.distance(self.pts[4], self.pts[11]) < 60:
                ch1 = 6

        # con for [x][d]
        l = [[1, 4], [1, 6], [1, 0], [1, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[5][0] - self.pts[4][0] - 15 > 0:
                ch1 = 6

        # con for [b][pqz]
        l = [[5, 0], [5, 1], [5, 4], [5, 5], [5, 6], [6, 1], [7, 6], [0, 2], [7, 1], [7, 4], [6, 6], [7, 2], [5, 0],
             [6, 3], [6, 4], [7, 5], [7, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and self.pts[18][1] > self.pts[20][
                1]):
                ch1 = 1

        # con for [f][pqz]
        l = [[6, 1], [6, 0], [0, 3], [6, 4], [2, 2], [0, 6], [6, 2], [7, 6], [4, 6], [4, 1], [4, 2], [0, 2], [7, 1],
             [7, 4], [6, 6], [7, 2], [7, 5], [7, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[6][1] < self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and
                    self.pts[18][1] > self.pts[20][1]):
                ch1 = 1

        l = [[6, 1], [6, 0], [4, 2], [4, 1], [4, 6], [4, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and
                    self.pts[18][1] > self.pts[20][1]):
                ch1 = 1

        # con for [d][pqz]
        fg = 19
        # print("_________________ch1=",ch1," ch2=",ch2)
        l = [[5, 0], [3, 4], [3, 0], [3, 1], [3, 5], [5, 5], [5, 4], [5, 1], [7, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if ((self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and
                 self.pts[18][1] < self.pts[20][1]) and (self.pts[2][0] < self.pts[0][0]) and self.pts[4][1] > self.pts[14][1]):
                ch1 = 1

        l = [[4, 1], [4, 2], [4, 4]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.distance(self.pts[4], self.pts[11]) < 50) and (
                    self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] <
                    self.pts[20][1]):
                ch1 = 1

        l = [[3, 4], [3, 0], [3, 1], [3, 5], [3, 6]]
        pl = [ch1, ch2]
        if pl in l:
            if ((self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and
                 self.pts[18][1] < self.pts[20][1]) and (self.pts[2][0] < self.pts[0][0]) and self.pts[14][1] < self.pts[4][1]):
                ch1 = 1

        l = [[6, 6], [6, 4], [6, 1], [6, 2]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[5][0] - self.pts[4][0] - 15 < 0:
                ch1 = 1

        # con for [i][pqz]
        l = [[5, 4], [5, 5], [5, 1], [0, 3], [0, 7], [5, 0], [0, 2], [6, 2], [7, 5], [7, 1], [7, 6], [7, 7]]
        pl = [ch1, ch2]
        if pl in l:
            if ((self.pts[6][1] < self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and
                 self.pts[18][1] > self.pts[20][1])):
                ch1 = 1

        # con for [yj][bfdi]
        l = [[1, 5], [1, 7], [1, 1], [1, 6], [1, 3], [1, 0]]
        pl = [ch1, ch2]
        if pl in l:
            if (self.pts[4][0] < self.pts[5][0] + 15) and (
            (self.pts[6][1] < self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and
             self.pts[18][1] > self.pts[20][1])):
                ch1 = 7

        # con for [uvr]
        l = [[5, 5], [5, 0], [5, 4], [5, 1], [4, 6], [4, 1], [7, 6], [3, 0], [3, 5]]
        pl = [ch1, ch2]
        if pl in l:
            if ((self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and
                 self.pts[18][1] < self.pts[20][1])) and self.pts[4][1] > self.pts[14][1]:
                ch1 = 1

        # con for [w]
        fg = 13
        l = [[3, 5], [3, 0], [3, 6], [5, 1], [4, 1], [2, 0], [5, 0], [5, 5]]
        pl = [ch1, ch2]
        if pl in l:
            if not (self.pts[0][0] + fg < self.pts[8][0] and self.pts[0][0] + fg < self.pts[12][0] and self.pts[0][0] + fg < self.pts[16][0] and
                    self.pts[0][0] + fg < self.pts[20][0]) and not (
                    self.pts[0][0] > self.pts[8][0] and self.pts[0][0] > self.pts[12][0] and self.pts[0][0] > self.pts[16][0] and self.pts[0][0] > self.pts[20][
                0]) and self.distance(self.pts[4], self.pts[11]) < 50:
                ch1 = 1

        # con for [w]

        l = [[5, 0], [5, 5], [0, 1]]
        pl = [ch1, ch2]
        if pl in l:
            if self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1]:
                ch1 = 1

        # -------------------------condn for 8 groups  ends

        # -------------------------condn for subgroups  starts
        #
        if ch1 == 0:
            ch1 = 'S'
            if self.pts[4][0] < self.pts[6][0] and self.pts[4][0] < self.pts[10][0] and self.pts[4][0] < self.pts[14][0] and self.pts[4][0] < self.pts[18][0]:
                ch1 = 'A'
            if self.pts[4][0] > self.pts[6][0] and self.pts[4][0] < self.pts[10][0] and self.pts[4][0] < self.pts[14][0] and self.pts[4][0] < self.pts[18][
                0] and self.pts[4][1] < self.pts[14][1] and self.pts[4][1] < self.pts[18][1]:
                ch1 = 'T'
            if self.pts[4][1] > self.pts[8][1] and self.pts[4][1] > self.pts[12][1] and self.pts[4][1] > self.pts[16][1] and self.pts[4][1] > self.pts[20][1]:
                ch1 = 'E'
            if self.pts[4][0] > self.pts[6][0] and self.pts[4][0] > self.pts[10][0] and self.pts[4][0] > self.pts[14][0] and self.pts[4][1] < self.pts[18][1]:
                ch1 = 'M'
            if self.pts[4][0] > self.pts[6][0] and self.pts[4][0] > self.pts[10][0] and self.pts[4][1] < self.pts[18][1] and self.pts[4][1] < self.pts[14][1]:
                ch1 = 'N'

        if ch1 == 2:
            if self.distance(self.pts[12], self.pts[4]) > 42:
                ch1 = 'C'
            else:
                ch1 = 'O'

        if ch1 == 3:
            if (self.distance(self.pts[8], self.pts[12])) > 72:
                ch1 = 'G'
            else:
                ch1 = 'H'

        if ch1 == 7:
            if self.distance(self.pts[8], self.pts[4]) > 42:
                ch1 = 'Y'
            else:
                ch1 = 'J'

        if ch1 == 4:
            ch1 = 'L'

        if ch1 == 6:
            ch1 = 'X'

        if ch1 == 5:
            if self.pts[4][0] > self.pts[12][0] and self.pts[4][0] > self.pts[16][0] and self.pts[4][0] > self.pts[20][0]:
                if self.pts[8][1] < self.pts[5][1]:
                    ch1 = 'Z'
                else:
                    ch1 = 'Q'
            else:
                ch1 = 'P'

        if ch1 == 1:
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and self.pts[18][1] > self.pts[20][
                1]):
                ch1 = 'B'
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] < self.pts[20][
                1]):
                ch1 = 'D'
            if (self.pts[6][1] < self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and self.pts[18][1] > self.pts[20][
                1]):
                ch1 = 'F'
            if (self.pts[6][1] < self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] > self.pts[20][
                1]):
                ch1 = 'I'
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and self.pts[18][1] < self.pts[20][
                1]):
                ch1 = 'W'
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] < self.pts[20][
                1]) and self.pts[4][1] < self.pts[9][1]:
                ch1 = 'K'
            if ((self.distance(self.pts[8], self.pts[12]) - self.distance(self.pts[6], self.pts[10])) < 8) and (
                    self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] <
                    self.pts[20][1]):
                ch1 = 'U'
            if ((self.distance(self.pts[8], self.pts[12]) - self.distance(self.pts[6], self.pts[10])) >= 8) and (
                    self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] <
                    self.pts[20][1]) and (self.pts[4][1] > self.pts[9][1]):
                ch1 = 'V'

            if (self.pts[8][0] > self.pts[12][0]) and (
                    self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] <
                    self.pts[20][1]):
                ch1 = 'R'

        if ch1 == 1 or ch1 =='E' or ch1 =='S' or ch1 =='X' or ch1 =='Y' or ch1 =='B':
            if (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] < self.pts[12][1] and self.pts[14][1] < self.pts[16][1] and self.pts[18][1] > self.pts[20][1]):
                ch1=" "



        print(self.pts[4][0] < self.pts[5][0])
        if ch1 == 'E' or ch1=='Y' or ch1=='B':
            if (self.pts[4][0] < self.pts[5][0]) and (self.pts[6][1] > self.pts[8][1] and self.pts[10][1] > self.pts[12][1] and self.pts[14][1] > self.pts[16][1] and self.pts[18][1] > self.pts[20][1]):
                ch1="next"


        if ch1 == 'Next' or 'B' or 'C' or 'H' or 'F' or 'X':
            if (self.pts[0][0] > self.pts[8][0] and self.pts[0][0] > self.pts[12][0] and self.pts[0][0] > self.pts[16][0] and self.pts[0][0] > self.pts[20][0]) and (self.pts[4][1] < self.pts[8][1] and self.pts[4][1] < self.pts[12][1] and self.pts[4][1] < self.pts[16][1] and self.pts[4][1] < self.pts[20][1]) and (self.pts[4][1] < self.pts[6][1] and self.pts[4][1] < self.pts[10][1] and self.pts[4][1] < self.pts[14][1] and self.pts[4][1] < self.pts[18][1]):
                ch1 = 'Backspace'


        if ch1=="next" and self.prev_char!="next":
            if self.ten_prev_char[(self.count-2)%10]!="next":
                if self.ten_prev_char[(self.count-2)%10]=="Backspace":
                    self.str=self.str[0:-1]
                else:
                    if self.ten_prev_char[(self.count - 2) % 10] != "Backspace":
                        self.str = self.str + str(self.ten_prev_char[(self.count-2)%10])
            else:
                if self.ten_prev_char[(self.count - 0) % 10] != "Backspace":
                    self.str = self.str + str(self.ten_prev_char[(self.count - 0) % 10])


        if ch1=="  " and self.prev_char!="  ":
            self.str = self.str + "  "

        self.prev_char=ch1
        self.current_symbol=ch1
        self.count += 1
        self.ten_prev_char[self.count%10]=ch1


        if len(self.str.strip())!=0:
            st=self.str.rfind(" ")
            ed=len(self.str)
            word=self.str[st+1:ed]
            self.word=word
            if len(word.strip())!=0:
                ddd.check(word)
                lenn = len(ddd.suggest(word))
                if lenn >= 4:
                    self.word4 = ddd.suggest(word)[3]

                if lenn >= 3:
                    self.word3 = ddd.suggest(word)[2]

                if lenn >= 2:
                    self.word2 = ddd.suggest(word)[1]

                if lenn >= 1:
                    self.word1 = ddd.suggest(word)[0]
            else:
                self.word1 = " "
                self.word2 = " "
                self.word3 = " "
                self.word4 = " "


    def destructor(self):
        print(self.ten_prev_char)
        self.root.destroy()
        self.vs.release()
        cv2.destroyAllWindows()


print("Starting Application...")

(Application()).root.mainloop()
