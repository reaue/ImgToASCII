# This program must transform images to ASCII with brightness and colour.
# The brightness can be represented by the following characters " .:-=+*#%@" in ASCII
# The brightness can be calculate as B = 0.2126 * R + 0.7152 * G + 0.0722 * B
# The finale goal is to add also transformation for videos becaus it's just a sequence of images. 

from PIL import Image


SIZE = 40
RATIO = 0.43 # ration between width and height of a Char
ASCII_CHAR = [" ", ".", ":", "-", "=", "+", "*", "#", "%", "@"]
result_list = []


image = Image.open("image.jpg")
image = image.convert("RGB")


def calculate_brightness(image, x_0, y_0, size):
    brightness_list = []
    for i in range(round(size * RATIO)):
        for j in range(size):
            pixel_RGB = image.getpixel((x_0 + i, y_0 + j))
            R, G, B = pixel_RGB
            brightness = 0.2126 * R + 0.7152 * G + 0.0722 * B # Varied between 0 (black) and 255 (white)
            brightness_list.append(brightness)
    return sum(brightness_list) / len(brightness_list)


for y_start in range(image.height // SIZE):
    for x_start in range(image.width // (round(SIZE * RATIO))):
        brightness = calculate_brightness(image, x_start * round(SIZE * RATIO), y_start * SIZE, SIZE)
        result_list.append(ASCII_CHAR[int(min(brightness / 255 * len(ASCII_CHAR), len(ASCII_CHAR) - 1))])
    result_list.append("\n")


result_str = "".join(result_list)

with open("result.txt", "w") as f:
    f.write(result_str)


image.close()