(function () {

  window.imagePath = 'IMG00001.dcm'
  window.editorList = []
  window.activeEdit = undefined
  window.dicomFileList = {}


  document.addEventListener('wlChange', (event) => {
    // console.log(event.detail);
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

  function init(){
    window.editorList.push(initCanvas('canvasParent', 'mainEditor'))
    // window.editorList.push(initCanvas('canvasParent1', 'mainEditor1'))
    // window.editorList.push(initCanvas('canvasParent2', 'mainEditor2'))
    var edit = window.activeEdit
    if (!edit) {  edit = editorList[0]; window.activeEdit = edit; }
    if (edit) { loadInfo(edit, window.imagePath) }
    // edit = editorList[1]; window.activeEdit = edit;
    // loadInfo(edit, window.imagePath)
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
      // var zoom = Math.min(edit.canvasView.width / imgWidth, edit.canvasView.height / imgHeight);
      // edit.canvasView.setZoom(zoom)
      var op = changeDicomWL(dataSet, windowWidth, windowCenter)
      if (!dicomFileList[fileName]) { dicomFileList[fileName] = {} }
      dicomFileList[fileName]['dataSet'] = dataSet
      edit.dicomFileName = fileName
      edit.canvasView.setBackgroundImage(op.src, function () {
        edit.canvasView.renderAll();
      }, {
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
      });
      document.dispatchEvent(new CustomEvent('wlChange', { detail: { ww: op.ww, wl: op.wl } }));
      
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
    var pixelDataElement = dataSet.elements.x7fe00010;
    var pixelData = new Uint16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement
      .length / 2);

    var img_min = 9999;
    var img_max = 0;

    var slope = instance['x00281053']
    var intercept = instance['x00281052']

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

  function resizeCanvas (canvasWidth, canvasHeight, imgWidth, imgHeight) {
    const rateX = canvasWidth / imgWidth
    const rateY = canvasHeight / imgHeight
    const zoom = Math.min(rateX, rateY)
    const x = (canvasWidth - imgWidth * zoom) / 2
    return { zoom: zoom, pan: { x: -1 * x, y: 0 } }
  }
  window.resizeCanvas = resizeCanvas

})()