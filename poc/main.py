# This program must transform images to ASCII with brightness and colour.
# The brightness can be represented by the following characters " .:-=+*#%@" in ASCII
# The brightness can be calculate as B = 0.2126 * R + 0.7152 * G + 0.0722 * B
# The finale goal is to add also transformation for videos because it's just a sequence of images. 

import tkinter as tk
import os
from tkinter import filedialog
from PIL import Image


root = tk.Tk()
root.withdraw()

SIZE = 10
command = ""
RATIO = 0.45 # ration between width and height of a Char
ASCII_CHAR = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"]
result_str = "Type select and convert an image before"


print("ImgToASCII\nType help to see available commands")


def calculate_brightness(image, x_0, y_0, size):
        brightness_list = []
        for i in range(round(size * RATIO)):
            for j in range(size):  
                pixel_RGB = image.getpixel((x_0 + i, y_0 + j))
                R, G, B = pixel_RGB
                brightness = 0.2126 * R + 0.7152 * G + 0.0722 * B # Varied between 0 (black) and 255 (white)
                brightness_list.append(brightness)
        return sum(brightness_list) / len(brightness_list)


while command != "exit":
    command = input(">>> ")

    if command == "help":
        print("- select : choose an image to convert into ASCII art\n- size : set you own size\n- show : render your ASCII art into this terminal\n- clear : to clear the terminal\n- exit : to stop the program")

    elif command == "size":
        SIZE = int(input("Select a size (recommended between 5 and 25) : "))

    elif command == "select":
        image_path = filedialog.askopenfilename(
        title="Choose an image",
        filetypes=[("Images", "*.jpg *.jpeg *.png *.bmp *.gif")]
        )

        if image_path:
            image = Image.open(image_path)
            image = image.convert("RGB")
            print("ASCII loading...")
        else:
            print("None image selected.")
            continue

        result_list = []

        for y_start in range(image.height // SIZE):
                for x_start in range(image.width // (round(SIZE * RATIO))):
                    brightness = calculate_brightness(image, x_start * round(SIZE * RATIO), y_start * SIZE, SIZE)
                    result_list.append(ASCII_CHAR[int(min(brightness / 255 * len(ASCII_CHAR), len(ASCII_CHAR) - 1))])
                result_list.append("\n")

        result_str = "".join(result_list)

        with open("poc/result.txt", "w") as f:
                f.write(result_str)
        
        print("Your ASCII image is ready look it in poc/result.txt !")

    elif command == "show":
         for line in result_str.split('\n'):
            print(line)

    elif command == "clear":
        os.system('cls||clear')

    elif command == "exit":
        exit()

    else:
         print("Command not found, type help to see available commands")


image.close()