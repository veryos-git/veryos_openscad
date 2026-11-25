goal: a small webapp that can generate 3d parts and svgs that make up a paper light box. 

what is a paper light box: 
it is a rectangular box that has slits on top . in each slit a rectangular object (paper or thin printed 3d print ) can be slided in
in the back of the box there is a possibility to attach a led backlight board or a rgbw pucklight. 
https://eu.store.bambulab.com/de/products/bambu-cmyk-backlight-board


the webapp should also provide parameters /settings for : 
    - x y size of the rectangles
    - number of rectangles
        - foreach rectangle boundary a svg should be loadable , resizable and movable.
            - thickness of rectangle , default 0.4mm
        - distance of recangles 
        - order of rectangles 


the webapp should have a nice preview simulation of the lit lightbox

a download button foreach thing separate (all the rectangles as svg or .stl and the box as stl)

