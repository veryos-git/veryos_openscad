› please help me creating an openscad⠂script that can generate a door knob.⠂i added all reference CAD files and screenshot of  an existing working door knob. 
here is also a text description. the knob consists of two parts the solid shape body and the remover part that cuts a 'hole' to be able to use a screw and screw it to a door. 
the hole is quite complex because it is optimized for fdm printng. instead of a simple round circle, it consists of three smaller circlers in a circular pattern with tangent lines that connect. 
the resulting shape is likea triangle with rounded corners. 
because today in normal FDM  print settings , 2 wall loops is the default. this is not strong enought , using the doorknob will rip away the core from the knob itself after a lot of use. 
therfore to make sure the knob has more material in the center , there is a slot that is cut away around the triangled hole. this will force the slicer to create complexer paths in the center of the part and therefore add more material. 



i recommend to make a module that creates the positive part of the cutaway. after that create the actual kob. and finally subtract the hole part from the knob. 