(function () {

  // window.imagePath = 'IMG00001.dcm'
  // window.imagePath = '1-1.dcm'
  // window.imagePath = '1211111_20200921_CT_3_153_001.dcm'
  // window.imagePath = 'DAA0001VS019.dcm'
  window.imagePath = './001/I0182471.dcm'
  // window.imagePath = 'I0076353.dcm'
  window.editorList = []
  window.activeEdit = undefined
  window.dicomFileList = {}
  window.fileDataView = {}


  document.addEventListener('wlChange', (event) => {
    // console.log('--- detail ---', event.detail);
    document.getElementById('newWW').value = event.detail.ww;
    document.getElementById('newWL').value = event.detail.wl;
  });

  init()


  window.addEventListener('resize', function () {
    setTimeout(function () {
      for (var i = 0; i < editorList.length; i++) {
        var elem = document.getElementById(editorList[i].defaultOptions.canvasViewId).parentNode.parentNode;
        editorList[i].canvasView.setWidth(parseInt(elem.offsetWidth))
        editorList[i].canvasView.setHeight(parseInt(elem.offsetHeight))
        editorList[i].canvasView.renderAll()
      }
    }, 300)
  });

  function init() {

    // layout1
    // var edit = window.activeEdit
    // window.editorList.push(initCanvas('canvasParent', 'mainEditor'))
    // if (!edit) {
    //   edit = editorList[0];
    //   window.activeEdit = edit;
    // }
    // if (edit) {
    //   loadInfoD(edit, window.imagePath)
    // }

    // init all
    var edit = window.activeEdit
    for (var i = 0; i < 4; i++) {
      if (!i) {
        window.editorList.push(initCanvas('canvasParent', 'mainEditor'))
        loadInfoD(editorList[i], window.imagePath)
        // loadFolder(editorList[i])
      } else { window.editorList.push(initCanvas('canvasParent' + i, 'mainEditor' + i)) }
      // loadInfoD(editorList[i], window.imagePath)
    }
    if (!edit) {  edit = editorList[0]; window.activeEdit = edit; $('#canvasParent').addClass('activeView') }
  }

  function initCanvas(canvasId, canvasViewId) {
    var elem = document.getElementById(canvasId);
    window.viewWidth = elem.clientWidth
    window.tempCanvasWidth = window.viewWidth * 2.0
    var edit = new hiDraw({
      canvasViewId: canvasViewId,
      // viewJsonTextId: 'hiJsonArea',
      // activeJsonTextId: 'hiActiveJsonArea',
      canvasWidth: elem.offsetWidth,
      canvasHeight: elem.offsetHeight,
      objectDefault: {
        fillAlpha: 0,
        lineWidth: 1,
        strokeColor: 'rgba(51, 51, 51, 1)',
        eventCtrl: {
          mouse_wheel_default_behavior: true,
          mouse_down_default_behavior: true,
          mouse_move_default_behavior: true,
          mouse_up_default_behavior: true,
          zoomMax: 128,
          zoomMin: 0.01
        }
      },
      event: {
        object_added: function (opt) {},
        object_modified: function (opt) {},
        object_removed: function (opt) {},
        after_render: function (opt) {},
        selection_created: function (opt) {},
        selection_updated: function (opt) {},
        selection_cleared: function (opt) {},
        import_callback: function () {},
        mouse_wheel: function (opt) {},
        mouse_down: function (opt) {},
        mouse_move: function (opt) {},
        mouse_up: function (opt) {}
      }
    }).createView().viewEvent();

    return edit;
  }

  function multiElementToString(dataSet, tag, numItems, func) {
    var result = ''
    for (var i = 0; i < numItems; i++) {
      if (i !== 0) {
        result += '/'
      }
      result += func.call(dataSet, tag, i).toString()
    }
    return result
  }


  function loadInfo(edit, fileName) {
    loadDICOM(fileName).then((dataSet) => {
      var options = {
        omitPrivateAttibutes: false,
        maxElementLength: 1024 // 128
      };
      var instance = dicomParser.explicitDataSetToJS(dataSet, options);
      var windowWidth = instance['x00281051'];
      var windowCenter = instance['x00281050'];
      var imgWidth = instance['x00280010'];
      var imgHeight = instance['x00280011'];
      // let windowWidth
      // let windowCenter
      // if (dataSet.elements) {
      //   if (dataSet.elements.x00281051 && dataSet.elements.x00281051.vr) {
      //     const instance = dicomParser.explicitDataSetToJS(dataSet, options)
      //     windowWidth = instance.x00281051
      //     windowCenter = instance.x00281050
      //   }
      // }
      // var zoom = Math.min(edit.canvasView.width / imgWidth, edit.canvasView.height / imgHeight);
      // edit.canvasView.setZoom(zoom)
      var op = changeDicomWL(dataSet, windowWidth, windowCenter)
      if (!dicomFileList[fileName]) {
        dicomFileList[fileName] = {}
      }
      dicomFileList[fileName]['dataSet'] = dataSet
      edit.dicomFileName = fileName
      edit.dicomInfo = {
        ww: op.ww,
        wl: op.wl
      }
      edit.canvasView.setBackgroundImage(op.src, function () {
        edit.canvasView.renderAll();
      }, {
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
      });
      document.dispatchEvent(new CustomEvent('wlChange', {
        detail: {
          ww: op.ww,
          wl: op.wl
        }
      }));

      // 圖移置中
      var rs = resizeCanvas(edit.canvasView.width, edit.canvasView.height, imgWidth, imgHeight)
      edit.canvasView.setZoom(rs.zoom)
      edit.canvasView.absolutePan(rs.pan)
      return false
    })
  }

  function loadDICOM(fileName) {
    return new Promise((resolve, reject) => {
      var oReq = new XMLHttpRequest();
      oReq.open("GET", fileName, true);
      oReq.responseType = "arraybuffer";
      oReq.onload = function (oEvent) {
        var arrayBuffer = oReq.response; // Note: not oReq.responseText
        if (arrayBuffer) {
          var byteArray = new Uint8Array(arrayBuffer);
          var dataSet = dicomParser.parseDicom(byteArray);
          resolve(dataSet)
        }
      };
      oReq.send(null);
    })
  }

  function changeDicomWL(dataSet, windowWidth, windowCenter) {
    // alert(windowWidth +'_'+ windowCenter)
    // var dataSet = dicomDataset
    var options = {
      omitPrivateAttibutes: false,
      maxElementLength: 1024 // 128
    };
    var instance = dicomParser.explicitDataSetToJS(dataSet, options);
    var width = instance['x00280010'];
    var height = instance['x00280011'];
    var slope = instance['x00281053']
    var intercept = instance['x00281052']
    // var width = this.multiElementToString(dataSet, 'x00280010', dataSet.elements.x00280010.length / 2, dataSet.uint16)
    // var height = this.multiElementToString(dataSet, 'x00280011', dataSet.elements.x00280011.length / 2, dataSet.uint16)
    // var slope = 1
    // var intercept = 0
    var pixelDataElement = dataSet.elements.x7fe00010;
    var pixelData = new Uint16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement
      .length / 2);

    var img_min = 65535;
    var img_max = 0;

    var canvasCopy = document.createElement("canvas");
    canvasCopy.width = width;
    canvasCopy.height = height;
    var ctxCopy = canvasCopy.getContext("2d");
    var imgDataCopy = ctxCopy.createImageData(width, height);
    var dataCopy = imgDataCopy.data
    if (windowWidth === null || windowCenter === null ||
      windowWidth === undefined || windowCenter === undefined) {
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          var idx = y * width + x;
          var r = pixelData[idx]
          tempPixel = parseFloat(r)
          if (tempPixel < img_min) {
            img_min = tempPixel
          } else if (tempPixel > img_max) {
            img_max = tempPixel
          }
        }
      }
    } else {
      img_min = parseFloat(windowCenter - windowWidth / 2) // minimum HU level
      img_max = parseFloat(windowCenter + windowWidth / 2) // maximum HU level
    }
    var i = 0;
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        var idx = y * width + x;
        var r = pixelData[idx]
        var tempPixel = parseFloat(r) * parseFloat(slope) + parseFloat(intercept)
        tempPixel = r
        if (tempPixel < img_min) {
          tempPixel = img_min
        } else if (tempPixel > img_max) {
          tempPixel = img_max
        }

        uint8pixel = parseInt((tempPixel - img_min) / (img_max - img_min) * 255)
        dataCopy[i] = uint8pixel;
        dataCopy[i + 1] = uint8pixel;
        dataCopy[i + 2] = uint8pixel;
        dataCopy[i + 3] = 255;
        i += 4;
      }
    }
    ctxCopy.putImageData(imgDataCopy, 0, 0);
    // document.querySelector("#app").setAttribute("src", canvasCopy.toDataURL());
    return {
      src: canvasCopy.toDataURL(),
      ww: img_max - img_min,
      wl: (img_min + img_max) / 2
    }
  }

  window.changeDicomWL = changeDicomWL

  function resizeCanvas(canvasWidth, canvasHeight, imgWidth, imgHeight) {
    const rateX = canvasWidth / imgWidth
    const rateY = canvasHeight / imgHeight
    const zoom = Math.min(rateX, rateY)
    const x = (canvasWidth - imgWidth * zoom) / 2
    return {
      zoom: zoom,
      pan: {
        x: -1 * x,
        y: 0
      }
    }
  }
  window.resizeCanvas = resizeCanvas






  // use daikon ---------------------------------------------------------
  function loadDICOMD(fileName) {
    return new Promise((resolve, reject) => {
      var oReq = new XMLHttpRequest();
      oReq.open("GET", fileName, true);
      oReq.responseType = "arraybuffer";
      oReq.onload = function (oEvent) {
        var arrayBuffer = oReq.response; // Note: not oReq.responseText
        if (arrayBuffer) {
          // var byteArray = new Uint8Array(arrayBuffer);
          // var dataSet = dicomParser.parseDicom(byteArray);
          resolve(arrayBuffer)
        }
      };
      oReq.send(null);
    })
  }

  function loadInfoD(edit, fileName) {
    loadDICOMD(fileName).then((arrayBuffer) => {
      parseBufferArrayAndSetBackground(edit, fileName, arrayBuffer)
      // const data2 = new DataView(arrayBuffer);
      // const image = daikon.Series.parseImage(data2);
      // var windowWidth = image.getWindowWidth()
      // var windowCenter = image.getWindowCenter()
      // var op = changeDicomWLD(image, windowWidth, windowCenter)
      // if (!dicomFileList[fileName]) {
      //   dicomFileList[fileName] = {}
      // }
      // dicomFileList[fileName]['dataSet'] = image
      // edit.dicomFileName = fileName
      // edit.dicomInfo = {
      //   ww: op.ww,
      //   wl: op.wl,
      //   width: op.width,
      //   height: op.height
      // }

      // // var obj = image.getInterpretedData(false, true);
      // // var width = obj.numCols;
      // // var height = obj.numRows;

      // // var array = new Uint8ClampedArray(obj.data);
      // // var canvas = document.createElement("canvas");
      // // canvas.width = width;
      // // canvas.height = height;
      // // var ctx = canvas.getContext("2d");
      // // var imgData = ctx.createImageData(width, height); // width x height
      // // var data = imgData.data;
      // // for (var i = 3, k = 0; i < data.byteLength; i = i + 4, k = k + 1) {
      // //   var result = (array[k] & 0xff);
      // //   // data[i] = 255 - result;
      // //   data[i - 3] = result;
      // //   data[i - 2] = result;
      // //   data[i - 1] = result;
      // //   data[i] = 255;
      // // }
      // // ctx.putImageData(imgData, 0, 0);
      // // var op = {
      // //   src: canvas.toDataURL(),
      // //   ww: windowWidth,
      // //   wl: windowCenter
      // // }

      // edit.canvasView.setBackgroundImage(op.src, function () {
      //   edit.canvasView.renderAll();
      // }, {
      //   originX: 'left',
      //   originY: 'top',
      //   left: 0,
      //   top: 0,
      // });
      // document.dispatchEvent(new CustomEvent('wlChange', {
      //   detail: {
      //     ww: op.ww,
      //     wl: op.wl
      //   }
      // }));

      // // 圖移置中
      // var rs = resizeCanvas(edit.canvasView.width, edit.canvasView.height, op.width, op.height)
      // edit.canvasView.setZoom(rs.zoom)
      // edit.canvasView.absolutePan(rs.pan)
    })
  }

  function parseBufferArrayAndSetBackground (edit, fileName, arrayBuffer) {
    console.log('arrayBuffer', arrayBuffer)
    const data2 = new DataView(arrayBuffer);
    console.log('data2', data2)
    const image = daikon.Series.parseImage(data2);
    window.image = image
    var windowWidth = image.getWindowWidth()
    var windowCenter = image.getWindowCenter()
    console.log('image', image)
    console.log(image.getNumberOfSamplesPerPixel())
    var op = changeDicomWLD(image, windowWidth, windowCenter)
    if (!dicomFileList[fileName]) {
      dicomFileList[fileName] = {}
    }
    dicomFileList[fileName]['dataSet'] = image
    dicomFileList[fileName]['imageNum'] = image.getImageNumber()
    edit.dicomFileName = fileName
    edit.dicomInfo = {
      ww: op.ww,
      wl: op.wl,
      width: op.width,
      height: op.height
    }
    edit.canvasView.setBackgroundImage(op.src, function () {
      edit.canvasView.renderAll();
    }, {
      originX: 'left',
      originY: 'top',
      left: 0,
      top: 0,
    });
    document.dispatchEvent(new CustomEvent('wlChange', {
      detail: {
        ww: op.ww,
        wl: op.wl
      }
    }));
    // 圖移置中
    var rs = resizeCanvas(edit.canvasView.width, edit.canvasView.height, op.width, op.height)
    edit.canvasView.setZoom(rs.zoom)
    edit.canvasView.absolutePan(rs.pan)
  }
  window.parseBufferArrayAndSetBackground = parseBufferArrayAndSetBackground

  function changeDicomWLD(dataSet, windowWidth, windowCenter) {
    var image = dataSet
    var samplesPerPixel = image.getNumberOfSamplesPerPixel()
    var bitsAllocated = image.getBitsAllocated()
    var obj = image.getInterpretedData(false, true);
    var width = obj.numCols;
    var height = obj.numRows;
    // console.log('width', width, 'height', height, 'samplesPerPixel', samplesPerPixel, 'bitsAllocated', bitsAllocated, obj, obj.data)
    var slope = 1
    var intercept = 0

    var imgMin = 65535;
    var imgMax = 0;
    var tempPixel

    // var array = new Uint8ClampedArray(obj.data);
    var array = new Float64Array(obj.data);
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    var imgData = ctx.createImageData(width, height); // width x height
    var data = imgData.data;
    // ------------------
    if (
      bitsAllocated === 8 &&
      (samplesPerPixel === 3 || samplesPerPixel === 4)
    ) {
      if (windowWidth === null || windowCenter === null ||
        windowWidth === undefined || windowCenter === undefined) {
        for (let p = 0; p < array.length; p++) {
          tempPixel = parseFloat(array[p])
          if (tempPixel < imgMin) {
            imgMin = tempPixel
          } else if (tempPixel > imgMax) {
            imgMax = tempPixel
          }
        }
      } else {
        imgMin = parseFloat(windowCenter - windowWidth / 2) // minimum HU level
        imgMax = parseFloat(windowCenter + windowWidth / 2) // maximum HU level
      }
      var i = 0;
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          if (samplesPerPixel === 3) {
            var idx = y * width + x;
            var r = array[3 * idx + 0];
            var g = array[3 * idx + 1];
            var b = array[3 * idx + 2];
            data[i] = pixel(r, slope, intercept, imgMin, imgMax);
            data[i + 1] = pixel(g, slope, intercept, imgMin, imgMax);
            data[i + 2] = pixel(b, slope, intercept, imgMin, imgMax);
            data[i + 3] = 255;
            i += 4;
          }
          if (samplesPerPixel === 4) {
            var idx = y * width + x;
            var r = array[4 * idx + 0];
            var g = array[4 * idx + 1];
            var b = array[4 * idx + 2];
            data[i] = pixel(r, slope, intercept, imgMin, imgMax);
            data[i + 1] = pixel(g, slope, intercept, imgMin, imgMax);
            data[i + 2] = pixel(b, slope, intercept, imgMin, imgMax);
            data[i + 3] = array[4 * idx + 3];
            i += 4;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      return {
        src: canvas.toDataURL(),
        ww: imgMax - imgMin,
        wl: (imgMin + imgMax) / 2,
        width: width,
        height: height
      }
      // return decodeJPEGBaseline8BitColor(imageFrame, pixelData, canvas);
    } else {
      if (windowWidth === null || windowCenter === null ||
        windowWidth === undefined || windowCenter === undefined) {
        for (var y = 0; y < height; y++) {
          for (var x = 0; x < width; x++) {
            var idx = y * width + x;
            var r = array[idx];
            tempPixel = parseFloat(r)
            if (tempPixel < imgMin) {
              imgMin = tempPixel
            } else if (tempPixel > imgMax) {
              imgMax = tempPixel
            }
          }
        }
      } else {
        imgMin = parseFloat(windowCenter - windowWidth / 2) // minimum HU level
        imgMax = parseFloat(windowCenter + windowWidth / 2) // maximum HU level
      }
      var i = 0;
      for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
          var idx = y * width + x;
          var r = array[idx];
          var tempPixel = parseFloat(r) * parseFloat(slope) + parseFloat(intercept)
          // tempPixel = r
          if (tempPixel < imgMin) {
            tempPixel = imgMin
          } else if (tempPixel > imgMax) {
            tempPixel = imgMax
          }
          uint8pixel = parseInt((tempPixel - imgMin) / (imgMax - imgMin) * 255)
          data[i] = uint8pixel;
          data[i + 1] = uint8pixel;
          data[i + 2] = uint8pixel;
          data[i + 3] = 255;
          i += 4;
        }
      }
      // ------------------
      // for (var i = 3, k = 0; i < data.byteLength; i = i + 4, k = k + 1) {
      //   var result = (array[k] & 0xff);
      //   // data[i] = 255 - result;
      //   data[i - 3] = result;
      //   data[i - 2] = result;
      //   data[i - 1] = result;
      //   data[i] = 255;
      // }
      ctx.putImageData(imgData, 0, 0);
      return {
        src: canvas.toDataURL(),
        ww: imgMax - imgMin,
        wl: (imgMin + imgMax) / 2,
        width: width,
        height: height
      }
    } // ---------
    
  }

  window.changeDicomWLD = changeDicomWLD


  function pixel (c, slope, intercept, imgMin, imgMax) {
    var tempPixel = parseFloat(c) * parseFloat(slope) + parseFloat(intercept)
    // tempPixel = r
    if (tempPixel < imgMin) {
      tempPixel = imgMin
    } else if (tempPixel > imgMax) {
      tempPixel = imgMax
    }
    return uint8pixel = parseInt((tempPixel - imgMin) / (imgMax - imgMin) * 255)
  }

  function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }

  function loop () {
    // console.log('A0')
    if(typeof edit !== 'undefined') {
      const listAry = []
      for (var k in dicomFileList) {
        dicomFileList[k].fileName = k
        listAry.push(dicomFileList[k])
      }
      listAry.sort(function(a, b){
        return parseInt(a.imageNum) - parseInt(b.imageNum)
        // if(isNumeric(a.imageNum) && isNumeric(b.imageNum)) {
        //   return parseInt(a.imageNum) - parseInt(b.imageNum)
        // } else {
        //   console.log('why?')
        //   return a.fileName - b.fileName
        // }
      })
      // console.log('A1', listAry)
      for (var i = 0;listAry.length > 1 && i < listAry.length; i++) {
        // console.log('A2', edit.dicomFileName, listAry[i].fileName)
        if(edit.dicomFileName === listAry[i].fileName) {
          // console.log('A3')
          const j = i !== listAry.length - 1 ? i + 1 : 0
          let image = listAry[j].dataSet
          var windowWidth = image.getWindowWidth()
          var windowCenter = image.getWindowCenter()
          var op = changeDicomWLD(image, windowWidth, windowCenter)
          edit.dicomFileName = listAry[j].fileName
          edit.dicomInfo = {
            ww: op.ww,
            wl: op.wl,
            width: op.width,
            height: op.height
          }
          edit.canvasView.setBackgroundImage(op.src, function () {
            edit.canvasView.renderAll();
          }, {
            originX: 'left',
            originY: 'top',
            left: 0,
            top: 0,
          });
          document.dispatchEvent(new CustomEvent('wlChange', {
            detail: {
              ww: op.ww,
              wl: op.wl
            }
          }));
          // 圖移置中
          var rs = resizeCanvas(edit.canvasView.width, edit.canvasView.height, op.width, op.height)
          edit.canvasView.setZoom(rs.zoom)
          edit.canvasView.absolutePan(rs.pan)
          break;
        }
      }
      // for (var k in dicomFileList) {
      //   if(edit.dicomFileName === k) { break; }
      //   let image = dicomFileList[k].dataSet
      //   var windowWidth = image.getWindowWidth()
      //   var windowCenter = image.getWindowCenter()
      //   var op = changeDicomWLD(image, windowWidth, windowCenter)
      //   edit.dicomFileName = k
      //   edit.dicomInfo = {
      //     ww: op.ww,
      //     wl: op.wl,
      //     width: op.width,
      //     height: op.height
      //   }
      //   edit.canvasView.setBackgroundImage(op.src, function () {
      //     edit.canvasView.renderAll();
      //   }, {
      //     originX: 'left',
      //     originY: 'top',
      //     left: 0,
      //     top: 0,
      //   });
      //   document.dispatchEvent(new CustomEvent('wlChange', {
      //     detail: {
      //       ww: op.ww,
      //       wl: op.wl
      //     }
      //   }));
      //   // 圖移置中
      //   var rs = resizeCanvas(edit.canvasView.width, edit.canvasView.height, op.width, op.height)
      //   edit.canvasView.setZoom(rs.zoom)
      //   edit.canvasView.absolutePan(rs.pan)
      // }
    }
    setTimeout(function(){loop()},300)
  }
  loop()

  function loadFolder(edit) {
    const str = './001/I0182'
    const dcm = '.dcm'
    // 'I0182508.dcm'
    for (var i = 472; i < 509; i++) {
      var filename = str + i + dcm
      loadInfoD(edit, filename)
    }
  }

})()