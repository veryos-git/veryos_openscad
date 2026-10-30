this should be a simply cylindrical container with a lid that can be screwed on to

parts: 
- container
- lid

the screwing container has a male /external thread 
the lid has a internal thread

the thread should be with an angle of 45 degrees and a pitch of 1 mm 

the external thread on the container should have a slight chamfer so that it is easy to align and screw the lid on



the object consist of two parts with the folllowing parameters (optionally more)

- object
    - param: full height: 80 mm
    - param: outer diameter: 40 mm
    - param: wall thickness: 1.2mm
    - param: thread pitch: 1.2mm
    - base
        - param: thread_entry_chamfer: 1mm
        - param: chamfer: 0.5mm
        - param: external thread top surface extrusion (screw lid alignment) 
            - this parameter is there for solving this problem: 
                - lets say the lid and base both have a marking that should align perfectly when the lid is screwed on. by default the lid will overshoot this a bit. to make the lid touch the base more early when screwed on , we can extrude a bit from the last top sufrface of the base external thread.  
    - lid
        - param: chamfer
        - param: height: 30 mm
        - param: thread height: 3mm
        - param: thread entry chamfer: 1mm



