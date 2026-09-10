# Image to ASCII art.

A web-based tool that converts images, videos and text into ASCII art directly in your browser.

![alt text](result.png)

## Try it

Want to try it yourself ?  [**DEMO**](https://reaue.github.io/ImgToASCII/)

## Features

- Convert images into ASCII art.
- Adjustable ASCII resolution.
- All the window is a drag and drop zone. 
- Choose between full-color or black and white rendering.
- Choose if you want to see your image in invert mod or not.
- Copy directly to cliboard in one click.
- Save as different extensions such as `PNG`, `JPG`, `GIF` and `MP4`. 
- See a real time loading bar when your pc calculate for the render.
- A text to ASCII converter powered by [Wikimedia API](https://commons.wikimedia.org/wiki/Accueil).
- A video to ASCII converter (don't see too big, it's not done for big video or high color rendering).

## Proof of concept

The algorithm was first developed in python as a proof of concept, you can find it in `poc/main.py`.

## How it works

The main idea is that this following string : `.:-=+*#%@"` contains all level of brightness and moreover you can easily find brightness from RGB values with this formula : `0.2126 * red + 0.7152 * green + 0.0722 * blue`, coefficients are different because human eye has a different sensitivity to red, green and blue.

# New features added for the V.3

I added some new features requested by raters (thanks to them). First, a text to ASCII converter powered by the [Wikimedia API](https://commons.wikimedia.org/wiki/Accueil). I also added a video to ASCII converter (including GIF). I also added more way to export your ASCII art and finally tried to hand over the site more understandable and user-friendly.

# How to run it locally

Clone the repository:

```bash
git clone https://github.com/reaue/ImgToASCII.git 
cd ImgToASCII
```
Intsall Pillow:
```bash
pip install Pillow
```
(Tkinter is usually included with pyhton)
Run the python prototype
```bash
cd poc
python main.py
```

I added terminal commands to choose between different options for this python program (but it has only basic feature, convert image to ASCII only in black and white).