function buildPalette(colorsList){
    const paletteContainer = document.getElementById("palette");
    const complementaryContainer = document.getElementById("complementary");
    // reset the HTML in case you load various images
    paletteContainer.innerHTML = "";
    complementaryContainer.innerHTML = "";
  
    const orderedByColor = orderByLuminance(colorsList);
    const hslColors = convertRGBtoHSL(orderedByColor);
  
    for (let i = 0; i < orderedByColor.length; i++) {
      const hexColor = rgbToHex(orderedByColor[i]);
    const hslColor = hslColors[i];
    const hexColorComplementary = hslColor ? hslToHex(hslColor) : null;

      if (i > 0) {
        const difference = calculateColorDifference(
          orderedByColor[i],
          orderedByColor[i - 1]
        );

        // if the distance is less than 120 we ommit that color
        if (difference < 120) {
          continue;
        }
      }

      // create the div and text elements for both colors & append it to the document
      const colorElement = document.createElement("div");
      colorElement.style.backgroundColor = hexColor;
      colorElement.appendChild(document.createTextNode(hexColor));
      colorElement.classList.add("btn");
      colorElement.classList.add("clr");
      colorElement.id = 'pcolor-'+hexColor;
      colorElement.onclick = function(){
        document.getElementById("refColor").style.backgroundColor = hexColor;
        document.getElementById("refColor").value = hexColor;
      };
      paletteContainer.appendChild(colorElement);
      // true when hsl color is not black/white/grey
      if (hslColor && hslColor.h !== undefined) {
        const complementaryElement = document.createElement("div");
        complementaryElement.style.backgroundColor = `hsl(${hslColor.h},${hslColor.s}%,${hslColor.l}%)`;
        complementaryElement.classList.add("btn");
        complementaryElement.classList.add("clr");
        complementaryElement.id = 'ccolor-'+hexColor;
        complementaryElement.onclick = function(){
          document.getElementById("refColor").style.backgroundColor = hexColorComplementary;
          document.getElementById("refColor").value = hexColorComplementary;
        };
        complementaryElement.appendChild(
          document.createTextNode(hexColorComplementary)
        );
        complementaryContainer.appendChild(complementaryElement);
      }
    }
  };
  
  //  Convert each pixel value ( number ) to hexadecimal ( string ) with base 16
  function rgbToHex(pixel){
    const componentToHex = (c) => {
      const hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    };
  
    return (
      "#" +
      componentToHex(pixel.r) +
      componentToHex(pixel.g) +
      componentToHex(pixel.b)
    ).toUpperCase();
  };
  
  /**
   * Convert HSL to Hex
   * this entire formula can be found in stackoverflow, credits to @icl7126 !!!
   * https://stackoverflow.com/a/44134328/17150245
   */
  function hslToHex(hslColor){
    const hslColorCopy = { ...hslColor };
    hslColorCopy.l /= 100;
    const a =
      (hslColorCopy.s * Math.min(hslColorCopy.l, 1 - hslColorCopy.l)) / 100;
    const f = (n) => {
      const k = (n + hslColorCopy.h / 30) % 12;
      const color = hslColorCopy.l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  };
  
  /**
   * Convert RGB values to HSL
   * This formula can be
   * found here https://www.niwa.nu/2013/05/math-behind-colorspace-conversions-rgb-hsl/
   */
  function convertRGBtoHSL(rgbValues) {
    return rgbValues.map((pixel) => {
      let hue,
        saturation,
        luminance = 0;
  
      // first change range from 0-255 to 0 - 1
      let redOpposite = pixel.r / 255;
      let greenOpposite = pixel.g / 255;
      let blueOpposite = pixel.b / 255;
  
      const Cmax = Math.max(redOpposite, greenOpposite, blueOpposite);
      const Cmin = Math.min(redOpposite, greenOpposite, blueOpposite);
  
      const difference = Cmax - Cmin;
  
      luminance = (Cmax + Cmin) / 2.0;
  
      if (luminance <= 0.5) {
        saturation = difference / (Cmax + Cmin);
      } else if (luminance >= 0.5) {
        saturation = difference / (2.0 - Cmax - Cmin);
      }
  
      /**
       * If Red is max, then Hue = (G-B)/(max-min)
       * If Green is max, then Hue = 2.0 + (B-R)/(max-min)
       * If Blue is max, then Hue = 4.0 + (R-G)/(max-min)
       */
      const maxColorValue = Math.max(pixel.r, pixel.g, pixel.b);
  
      if (maxColorValue === pixel.r) {
        hue = (greenOpposite - blueOpposite) / difference;
      } else if (maxColorValue === pixel.g) {
        hue = 2.0 + (blueOpposite - redOpposite) / difference;
      } else {
        hue = 4.0 + (greenOpposite - blueOpposite) / difference;
      }
  
      hue = hue * 60; // find the sector of 60 degrees to which the color belongs
  
      // it should be always a positive angle
      if (hue < 0) {
        hue = hue + 360;
      }
  
      // When all three of R, G and B are equal, we get a neutral color: white, grey or black.
      if (difference === 0) {
        return false;
      }
  
      return {
        h: Math.round(hue) + 180, // plus 180 degrees because that is the complementary color
        s: parseFloat(saturation * 100).toFixed(2),
        l: parseFloat(luminance * 100).toFixed(2),
      };
    });
  };
  
  /**
   * Using relative luminance we order the brightness of the colors
   * the fixed values and further explanation about this topic
   * can be found here -> https://en.wikipedia.org/wiki/Luma_(video)
   */
  function orderByLuminance(rgbValues){
    const calculateLuminance = (p) => {
      return 0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b;
    };
  
    return rgbValues.sort((p1, p2) => {
      return calculateLuminance(p2) - calculateLuminance(p1);
    });
  };
  
  function buildRgb(imageData){
    const rgbValues = [];
    // note that we are loopin every 4!
    // for every Red, Green, Blue and Alpha
    for (let i = 0; i < imageData.length; i += 4) {
      const rgb = {
        r: imageData[i],
        g: imageData[i + 1],
        b: imageData[i + 2],
      };
  
      rgbValues.push(rgb);
    }
  
    return rgbValues;
  };
  
  /**
   * Calculate the color distance or difference between 2 colors
   *
   * further explanation of this topic
   * can be found here -> https://en.wikipedia.org/wiki/Euclidean_distance
   * note: this method is not accuarate for better results use Delta-E distance metric.
   */
  function calculateColorDifference(color1, color2){
    const rDifference = Math.pow(color2.r - color1.r, 2);
    const gDifference = Math.pow(color2.g - color1.g, 2);
    const bDifference = Math.pow(color2.b - color1.b, 2);
  
    return rDifference + gDifference + bDifference;
  };
  
  // returns what color channel has the biggest difference
  function findBiggestColorRange(rgbValues){
    /**
     * Min is initialized to the maximum value posible
     * from there we procced to find the minimum value for that color channel
     *
     * Max is initialized to the minimum value posible
     * from there we procced to fin the maximum value for that color channel
     */
    let rMin = Number.MAX_VALUE;
    let gMin = Number.MAX_VALUE;
    let bMin = Number.MAX_VALUE;
  
    let rMax = Number.MIN_VALUE;
    let gMax = Number.MIN_VALUE;
    let bMax = Number.MIN_VALUE;
  
    rgbValues.forEach((pixel) => {
      rMin = Math.min(rMin, pixel.r);
      gMin = Math.min(gMin, pixel.g);
      bMin = Math.min(bMin, pixel.b);
  
      rMax = Math.max(rMax, pixel.r);
      gMax = Math.max(gMax, pixel.g);
      bMax = Math.max(bMax, pixel.b);
    });
  
    const rRange = rMax - rMin;
    const gRange = gMax - gMin;
    const bRange = bMax - bMin;
  
    // determine which color has the biggest difference
    const biggestRange = Math.max(rRange, gRange, bRange);
    if (biggestRange === rRange) {
      return "r";
    } else if (biggestRange === gRange) {
      return "g";
    } else {
      return "b";
    }
  };
  
  /**
   * Median cut implementation
   * can be found here -> https://en.wikipedia.org/wiki/Median_cut
   */
  function quantization(rgbValues, depth){
    const MAX_DEPTH = 4;
  
    // Base case
    if (depth === MAX_DEPTH || rgbValues.length === 0) {
      const color = rgbValues.reduce(
        (prev, curr) => {
          prev.r += curr.r;
          prev.g += curr.g;
          prev.b += curr.b;
  
          return prev;
        },
        {
          r: 0,
          g: 0,
          b: 0,
        }
      );
  
      color.r = Math.round(color.r / rgbValues.length);
      color.g = Math.round(color.g / rgbValues.length);
      color.b = Math.round(color.b / rgbValues.length);
  
      return [color];
    }
  
    /**
     *  Recursively do the following:
     *  1. Find the pixel channel (red,green or blue) with biggest difference/range
     *  2. Order by this channel
     *  3. Divide in half the rgb colors list
     *  4. Repeat process again, until desired depth or base case
     */
    const componentToSortBy = findBiggestColorRange(rgbValues);
    rgbValues.sort((p1, p2) => {
      return p1[componentToSortBy] - p2[componentToSortBy];
    });
  
    const mid = rgbValues.length / 2;
    return [
      ...quantization(rgbValues.slice(0, mid), depth + 1),
      ...quantization(rgbValues.slice(mid + 1), depth + 1),
    ];
  };

  function extract(){
    const imgFile = document.getElementById("imgfile");
    const image = new Image();
    const file = imgFile.files[0];
    const fileReader = new FileReader();
  
    // Whenever file & image is loaded procced to extract the information from the image
    fileReader.onload = () => {
      image.onload = () => {
        // Set the image size to be the same as of the uploaded image
        const canvas = document.getElementById("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
  
        /**
         * getImageData returns an array full of RGBA values
         * each pixel consists of four values: the red value of the colour, the green, the blue and the alpha
         * (transparency). For array value consistency reasons,
         * the alpha is not from 0 to 1 like it is in the RGBA of CSS, but from 0 to 255.
         */
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
  
        // Convert the image data to RGB values so its much simpler
        const rgbArray = buildRgb(imageData.data);
  
        /**
         * Color quantization
         * A process that reduces the number of colors used in an image
         * while trying to visually maintin the original image as much as possible
         */
        const quantColors = quantization(rgbArray, 0);
  
        // Create the HTML structure to show the color palette
        buildPalette(quantColors);
      };
      image.src = fileReader.result;
    };
    fileReader.readAsDataURL(file);
  };

  const preview = document.getElementById("preview");
  const videoFrame = document.getElementById("videoFrame");
  const cameraStatus = document.getElementById("cameraStatus");
  const startCameraButton = document.getElementById("startCamera");
  const capturePaletteButton = document.getElementById("capturePalette");
  const stopCameraButton = document.getElementById("stopCamera");

  let cameraStream = null;
  let paletteInterval = null;

  function setCameraStatus(message, isError = false) {
    if (cameraStatus) {
      cameraStatus.textContent = message;
      cameraStatus.style.color = isError ? "#d63333" : "#202124";
    }
  }

  function openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus("Camera is not supported by this browser.", true);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        cameraStream = stream;
        preview.srcObject = stream;
        preview.play();
        startCameraButton.disabled = true;
        capturePaletteButton.disabled = false;
        stopCameraButton.disabled = false;
        setCameraStatus("Camera active. Click Capture Palette or wait for automatic updates.");

        if (paletteInterval) {
          clearInterval(paletteInterval);
        }
        paletteInterval = setInterval(capturePalette, 5000);
      })
      .catch((error) => {
        setCameraStatus(`Unable to open camera: ${error.message}`, true);
      });
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    preview.srcObject = null;
    startCameraButton.disabled = false;
    capturePaletteButton.disabled = true;
    stopCameraButton.disabled = true;
    if (paletteInterval) {
      clearInterval(paletteInterval);
      paletteInterval = null;
    }
    setCameraStatus("Camera stopped.");
  }

  function capturePalette() {
    if (!cameraStream) {
      setCameraStatus("Open the camera first.", true);
      return;
    }

    if (preview.videoWidth === 0 || preview.videoHeight === 0) {
      setCameraStatus("Waiting for camera feed...", true);
      return;
    }

    const sampleWidth = 160;
    const sampleHeight = 120;
    videoFrame.width = sampleWidth;
    videoFrame.height = sampleHeight;

    const ctx = videoFrame.getContext("2d");
    ctx.drawImage(preview, 0, 0, sampleWidth, sampleHeight);
    const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const rgbArray = buildRgb(imageData.data);
    const quantColors = quantization(rgbArray, 0);
    buildPalette(quantColors);

    setCameraStatus("Palette extracted from live video frame.");
  }
