(function(){
  function changeLayout(num){
    setTimeout(function () {
      for (var i = 0; i < editorList.length; i++) {
        var elem = document.getElementById(editorList[i].defaultOptions.canvasViewId).parentNode.parentNode;
        editorList[i].canvasView.setWidth(parseInt(elem.offsetWidth))
        editorList[i].canvasView.setHeight(parseInt(elem.offsetHeight))
        editorList[i].canvasView.renderAll()
      }
    }, 100)
  }
  $('#btnlayout1').click(function(){
    $('#lContain').removeClass('layout2')
    $('#lContain').removeClass('layout3')
    $('#lContain').removeClass('layout4')
    $('#lContain').addClass('layout1')
    changeLayout()
  })
  $('#btnlayout2').click(function(){
    $('#lContain').removeClass('layout1')
    $('#lContain').removeClass('layout3')
    $('#lContain').removeClass('layout4')
    $('#lContain').addClass('layout2')
    changeLayout()
  })
  $('#btnlayout3').click(function(){
    $('#lContain').removeClass('layout1')
    $('#lContain').removeClass('layout2')
    $('#lContain').removeClass('layout4')
    $('#lContain').addClass('layout3')
    changeLayout()
  })
  $('#btnlayout4').click(function(){
    $('#lContain').removeClass('layout1')
    $('#lContain').removeClass('layout2')
    $('#lContain').removeClass('layout3')
    $('#lContain').addClass('layout4')
    changeLayout()
  })

  $('#canvasParent').click(function(){
    $('.activeView').removeClass('activeView')
    $('#canvasParent').addClass('activeView')
    edit = editorList[0]; window.activeEdit = edit;
    if (typeof edit.dicomInfo !== 'undefined') {
      document.getElementById('newWW').value = edit.dicomInfo.ww;
      document.getElementById('newWL').value = edit.dicomInfo.wl;
    }
  })
  $('#canvasParent1').click(function(){
    $('.activeView').removeClass('activeView')
    $('#canvasParent1').addClass('activeView')
    edit = editorList[1]; window.activeEdit = edit;
    if (typeof edit.dicomInfo !== 'undefined') {
      document.getElementById('newWW').value = edit.dicomInfo.ww;
      document.getElementById('newWL').value = edit.dicomInfo.wl;
    }
  })
  $('#canvasParent2').click(function(){
    $('.activeView').removeClass('activeView')
    $('#canvasParent2').addClass('activeView')
    edit = editorList[2]; window.activeEdit = edit;
    if (typeof edit.dicomInfo !== 'undefined') {
      document.getElementById('newWW').value = edit.dicomInfo.ww;
      document.getElementById('newWL').value = edit.dicomInfo.wl;
    }
  })
  $('#canvasParent3').click(function(){
    $('.activeView').removeClass('activeView')
    $('#canvasParent3').addClass('activeView')
    edit = editorList[3]; window.activeEdit = edit;
    if (typeof edit.dicomInfo !== 'undefined') {
      document.getElementById('newWW').value = edit.dicomInfo.ww;
      document.getElementById('newWL').value = edit.dicomInfo.wl;
    }
  })
})()