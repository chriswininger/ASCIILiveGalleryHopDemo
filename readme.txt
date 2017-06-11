1. npm install
2. rename config.example to config.json
  a. fill in twitter api key info
  b. other entries may need to be tweaked for the image to fit in the box on your screen

-- Make sure PKG_CONFIG_PATH is correctly to intall on mac or you may see compile errors running npm install
PKG_CONFIG_PATH=$PKG_CONFIG_PATH:/opt/X11/lib/pkgconfig npm install

-- Requirements --
Node 0.10.48, currently stuck on this version because of module Camera which uses old version of opencv
Best ran in terminal with monospace 8pt font (maybe 10pt) (will be faster but with less detail the larger the font)
  For 8pt font newWidth and newHeight can be set at 1000 by 1000
  For 12pt font try newHeight: 550, newWidth: 770
