(function () {
  var objOption = {
    // activeJsonTextId: 'hiActiveJsonArea',
    stroke: 'rgb(70,130,180)',
    endDraw: function () {
      activeEdit.changeCanvasProperty(true, false);
      activeEdit.changeSelectableStatus(true);
      activeEdit.viewEvent();
    },
    onSelected: function (opt) {

    }
  };

  $("#btnRect").click(function () {
    activeEdit.fabricObjDefaultOverride({stroke: 'rgb(70,130,180)', fill: 'transparent'})
    activeEdit.removeCanvasEvents();
    activeEdit.changeSelectableStatus(false);
    activeEdit.changeCanvasProperty(false, false);
    var squrect = new activeEdit.HiCube(activeEdit, objOption);
  });

  $("#btnEllipse").click(function () {
    activeEdit.fabricObjDefaultOverride({stroke: 'rgb(70,130,180)', fill: 'transparent'})
    activeEdit.removeCanvasEvents();
    activeEdit.changeSelectableStatus(false);
    activeEdit.changeCanvasProperty(false, false);
    var circle = new activeEdit.HiSphere(activeEdit, objOption);
  });
  
  $('#panCanvas').click(function () {
    const panCanvas = !activeEdit.defaultOptions.panCanvas
    if (panCanvas) { $('#panCanvas').addClass('btnActive') }
    else { $('#panCanvas').removeClass('btnActive') }
    activeEdit.changeSelectableStatus(!panCanvas)
    activeEdit.changeStatus({
      panCanvas: panCanvas
    })
  })

  
  $("#resizeCanvas").click(function () {
    // 圖移置中
    var rs = resizeCanvas(
      activeEdit.canvasView.width,
      activeEdit.canvasView.height,
      activeEdit.canvasView.backgroundImage.width,
      activeEdit.canvasView.backgroundImage.height
    )
    activeEdit.canvasView.setZoom(rs.zoom)
    activeEdit.canvasView.absolutePan(rs.pan)
  });

  $("#wlChange").click(function () {
    var elem = document.getElementById(activeEdit.defaultOptions.canvasViewId).parentNode;
    if (!document.getElementById('wlLayer')) {
      var div = document.createElement('div')
      div.id = 'wlLayer'
      div.style = 'position:absolute; top:0px; left:0px; width:100%; height:100%; z-index: 100; background-color: rgba(255,255,255, 0);'
      elem.appendChild(div)
      $('#wlLayer').on('mousedown', wlMouseDown)
      $('#wlLayer').on('mousemove', wlMouseMove)
      $('#wlLayer').on('mouseup', wlMouseUp)
      $('#wlChange').addClass('btnActive')
    } else {
      var div = document.getElementById('wlLayer')
      $('#wlLayer').off('mousedown', wlMouseDown)
      $('#wlLayer').off('mousemove', wlMouseMove)
      $('#wlLayer').off('mouseup', wlMouseUp)
      elem.removeChild(div);
      $('#wlChange').removeClass('btnActive')
    }
  });

  var mouseX, mouseY, newX, newY, startWW, startWC, newWWval, newWLval, startChangeWW = false, timeoutIdx;
  function wlMouseDown (e) {
    e.preventDefault();
    mouseX = e.clientX
    mouseY = e.clientY
    startWW = startWW || parseFloat($('#newWW').val())
    startWC = startWC || parseFloat($('#newWL').val())
    startChangeWW = true
  }
  function wlMouseMove (e) {
    e.preventDefault();
    // clearTimeout(timeoutIdx)
    // timeoutIdx = setTimeout(function () {
    if (startChangeWW) {
      newX = e.clientX
      newY = e.clientY
      var deltaX = mouseX - newX;
      var deltaY = mouseY - newY;
      newWWval = parseFloat(startWW + deltaX / 5)
      newWLval = parseFloat(startWC + deltaY / 5)
      var dataSet = dicomFileList[activeEdit.dicomFileName].dataSet
      // var op = changeDicomWL(dataSet, newWWval, newWLval)
      var op = changeDicomWLD(dataSet, newWWval, newWLval)
      activeEdit.canvasView.setBackgroundImage(op.src, function () {
        activeEdit.canvasView.renderAll();
      }, {
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
      });
      document.getElementById('newWW').value = newWWval;
      document.getElementById('newWL').value = newWLval;
      edit.dicomInfo.ww = newWWval;
      edit.dicomInfo.wl = newWLval;
    }
    // }, 10)
  }
  function wlMouseUp (e) {
    e.preventDefault();
    startWW = newWWval
    startWC = newWLval
    $('#newWW').val(newWWval)
    $('#newWL').val(newWLval)
    startChangeWW = false
    edit.dicomInfo.ww = newWWval;
    edit.dicomInfo.wl = newWLval;
  }
  
  $('#btnExport').click(function () {
    // var fabricJson = activeEdit.canvasView.toJSON(['label', 'uniqueIndex', 'hiId', 'altitude', 'source']);
    var fabricJson = activeEdit.toFabricJson()
    fabricJson["objects"] = fabricJson["objects"].filter(function (obj) {
      if (!obj['tempDrawShape']) {
        return true;
      } else {
        return false;
      }
    })
    // $('#currentJson').val(JSON.stringify(fabricJson))
    var json = activeEdit.export(fabricJson);
    $('#exportJson').val(JSON.stringify(json, null, 2))
  });
  
  $('#btnExportFabric').click(function () {
    // var fabricJson = activeEdit.canvasView.toJSON(['label', 'uniqueIndex', 'hiId', 'altitude', 'source']);
    var fabricJson = activeEdit.toFabricJson()
    fabricJson["objects"] = fabricJson["objects"].filter(function (obj) {
      if (!obj['tempDrawShape']) {
        return true;
      } else {
        return false;
      }
    })
    $('#currentJson').val(JSON.stringify(fabricJson, null, 2))
  });

  $('#btnLoadImage').click(function () {
    activeEdit.canvasView.loadFromJSON({})
    activeEdit.canvasView.setBackgroundImage('')
    newZoomToPoint({
      x: 0,
      y: 0
    }, 1)
    window.imagePath = $('#imagePath').val()
  })

  $('#newWW').on('change', function () {
    var ww = parseFloat(document.getElementById('newWW').value)
    var wc = parseFloat(document.getElementById('newWL').value)
    document.getElementById('wwText').innerHTML = ww
    var dataSet = dicomFileList[activeEdit.dicomFileName].dataSet
    // var op = changeDicomWL(dataSet, ww, wc)
    var op = changeDicomWLD(dataSet, ww, wc)
    activeEdit.canvasView.setBackgroundImage(op.src, function () {
      activeEdit.canvasView.renderAll();
    }, {
      originX: 'left',
      originY: 'top',
      left: 0,
      top: 0,
    });
    edit.dicomInfo.ww = ww;
    edit.dicomInfo.wl = wc;
  })
  $('#newWL').on('change', function () {
    var ww = parseFloat(document.getElementById('newWW').value)
    var wc = parseFloat(document.getElementById('newWL').value)
    document.getElementById('wlText').innerHTML = wc
    var dataSet = dicomFileList[activeEdit.dicomFileName].dataSet
    // var op = changeDicomWL(dataSet, ww, wc)
    var op = changeDicomWLD(dataSet, ww, wc)
    activeEdit.canvasView.setBackgroundImage(op.src, function () {
      activeEdit.canvasView.renderAll();
    }, {
      originX: 'left',
      originY: 'top',
      left: 0,
      top: 0,
    });
    edit.dicomInfo.ww = ww;
    edit.dicomInfo.wl = wc;
  })

    // ---------- drag And drop ------------

    function dropFunc (activeEdit, event) {
      event.originalEvent.dataTransfer.dropEffect = 'move';
      event.originalEvent.dataTransfer.effectAllowed = 'move';
      console.log('B', this.result, event.originalEvent.dataTransfer)
      // fetch FileList object
      var files = event.originalEvent.dataTransfer.files
      if (event.target && event.target.files) {
        files = event.target.files
      } else if (event.dataTransfer && event.dataTransfer.files) {
        files = event.dataTransfer.files
      } else if (event.originalEvent.dataTransfer && event.originalEvent.dataTransfer.files) {
        files = event.originalEvent.dataTransfer.files
      }
      if (!files) { return false; }
      // process all File objects
      for (var i = 0, f; f = files[i]; i++) {
        var fileName = f.name
        // console.log(f.name, 'type', f.type, 'size', f.size)
        if (i === 0) {
          var reader = new FileReader();
          reader.onloadend = function() {
              // var data = JSON.parse(this.result);
              parseBufferArrayAndSetBackground(activeEdit, fileName, this.result)
          };
          reader.readAsArrayBuffer(f);
          // FileReader.readAsArrayBuffer()
          // FileReader.readAsBinaryString()
          // FileReader.readAsDataURL()
          // FileReader.readAsText()
        }
      }
    }

    $("#canvasParent").on("dragover", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });
  
    $("#canvasParent").on("dragleave", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });

    $("#canvasParent").on("drop", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $('#canvasParent').click()
      dropFunc(activeEdit, event)
    });

    $("#canvasParent1").on("dragover", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });
  
    $("#canvasParent1").on("dragleave", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });

    $("#canvasParent1").on("drop", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $('#canvasParent1').click()
      dropFunc(activeEdit, event)
    });
    
    $("#canvasParent2").on("dragover", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });
  
    $("#canvasParent2").on("dragleave", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });

    $("#canvasParent2").on("drop", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $('#canvasParent2').click()
      dropFunc(activeEdit, event)
    });
    
    $("#canvasParent3").on("dragover", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });
  
    $("#canvasParent3").on("dragleave", function (event) {
      event.preventDefault();
      event.stopPropagation();
    });

    $("#canvasParent3").on("drop", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $('#canvasParent3').click()
      dropFunc(activeEdit, event)
    });
})()