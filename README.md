# Image to ASCII art.

A web-based tool that converts images into ASCII art directly in your browser.

![alt text](result.png)

## Try it

Want to try it yourself ?  [**DEMO**](https://reaue.github.io/ImgToASCII/)

## Features

- Convert images into ASCII art.
- Adjustable ASCII resolution.
- All the window is a drag and drop zone. 
- Choose between full-color or black and white rendering.
- Choose if you want to see your image in invert mod or not.
- Copy directly to cliboard or export as a png image with in one click.
- See a real time loading bar when your pc calculate for the render.

## Proof of concept

The algorithm was first developed in python as a proof of concept, you can find it in `poc/main.py`.

## How it works

The main idea is that this following string : `.:-=+*#%@"` contains all level of brightness and moreover you can easily find brightness from RGB values with this formula : `0.2126 * red + 0.7152 * green + 0.0722 * blue`, coefficients are different because human eye has a different sensitivity to red, green and blue.

# New features added for the V.2

I added some features requested by raters. Firstly, an invert button which switch color and so brightness. After that, a drag and drop zone located on the all window. Then I added a progress notification, such as you can see when you computer calculate for the render. And finally the hardest part, the algorithm optimization. For example instead of reading pixel multiple time for once calculate the brightness, then render the pixel, ... Now I do all of that in same time. I also sucess to optimize more the black and white render. Now I render characters only at the end of the line, instead of drawing them each by each. Unfortunately, it's not possible for the color mode.

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

# Possible features incoming

- [ ] A describe to ASCII converter based on Google API search
- [ ] Adding video (it will cost a lot of calculation time)
- [x] Fixing the copy feature