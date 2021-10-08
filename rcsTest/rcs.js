function arrayStrToNumber(ary) {
  ary.forEach(function (value, i) {
    ary[i] = parseFloat(value)
  })
  return ary
}

// #1 從dicom tag中取出相對應的屬性 
function FrameGeometry(dataSet) {
  return {
    FrameOfReferenceUID: dataSet.tagsFlat['00200052'].value[0],
    ImagePositionPatient: dataSet.tagsFlat['00200032'].value, // 圖左上角座標
    ImageOrientationPatient: dataSet.tagsFlat['00200037'].value, // 圖 X,Y 方向向量
    PixelSpacing: dataSet.tagsFlat['00280030'].value, // 圖 X,Y 方向縮放倍率 (s1,s2)	
    Columns: dataSet.tagsFlat['00280011'].value[0], // 圖 Y 長度
    Rows: dataSet.tagsFlat['00280010'].value[0] // 圖 X 長度
  }
}

// #2 比對兩個 dicom 之間是否有關連
function checkReferenceID(source, destination) {
  if (source.FrameOfReferenceUID !== destination.FrameOfReferenceUID) {
    return false
  }
  if (!source.ImageOrientationPatient || !destination.ImageOrientationPatient) {
    return false
  }
  if (JSON.stringify(source.ImageOrientationPatient) === JSON.stringify(destination.ImageOrientationPatient)) {
    return false
  }
  return true
}

// #3 計算平面法向量
function normalVector(plane) {
  var vector = new Array(3)
  var v = plane.ImageOrientationPatient
  vector[0] = v[1] * v[5] - v[2] * v[4]
  vector[1] = v[2] * v[3] - v[0] * v[5]
  vector[2] = v[0] * v[4] - v[1] * v[3]
  return vector
}

// #4 計算有界平面四個頂點座標
function vertices(plane) {
  var v0 = new Array(3),
    v1 = new Array(3),
    v2 = new Array(3),
    v3 = new Array(3),
    vr = new Array(3),
    vc = new Array(3)
  v0 = plane.ImagePositionPatient
  vr = [
    plane.ImageOrientationPatient[0],
    plane.ImageOrientationPatient[1],
    plane.ImageOrientationPatient[2]
  ]
  vc = [
    plane.ImageOrientationPatient[3],
    plane.ImageOrientationPatient[4],
    plane.ImageOrientationPatient[5]
  ]
  // v1 
  v0.forEach(function (value, index) {
    v1[index] = value + vr[index] * (plane.PixelSpacing[0] * plane.Rows)
  })
  // v2 
  v1.forEach(function (value, index) {
    v2[index] = value + vc[index] * (plane.PixelSpacing[1] * plane.Columns)
  })
  // v3 
  v0.forEach(function (value, index) {
    v3[index] = value + vc[index] * (plane.PixelSpacing[1] * plane.Columns)
  })
  return {
    topLeft: v0,
    topRight: v1,
    bottomRight: v2,
    bottomLeft: v3
  }
}

// #5 計算兩個向量內積
function dotProduct(vector1, vector2) {
  var np
  np = vector1[0] * vector2[0]
  np += vector1[1] * vector2[1]
  np += vector1[2] * vector2[2]
  return np
}

// #6 計算來源plane1與目標plane2，相交在plane2邊界上的兩個點
function intersectionLocalizer(plane1, plane2) {
  var nA, nB, nC, nD, nP, t;
  var points = [],
    v0 = new Array(3),
    v1 = new Array(3);
  nP = dotProduct(plane1.NormalVector, plane1.Vertices.topLeft)
  nA = dotProduct(plane1.NormalVector, plane2.Vertices.topLeft)
  nB = dotProduct(plane1.NormalVector, plane2.Vertices.topRight)
  nC = dotProduct(plane1.NormalVector, plane2.Vertices.bottomRight)
  nD = dotProduct(plane1.NormalVector, plane2.Vertices.bottomLeft)
  // line01
  if (Math.abs(nB - nA) > 0) {
    t = (nP - nA) / (nB - nA);
    v0 = plane2.Vertices.topLeft
    v1 = plane2.Vertices.topRight
    console.log('A', t, v0, v1)
    if (t > 0 && t <= 1) {
      var point = new Array(3)
      point[0] = v0[0] + t * (v1[0] - v0[0])
      point[1] = v0[1] + t * (v1[1] - v0[1])
      point[2] = v0[2] + t * (v1[2] - v0[2])
      points.push(point)
      point = null
      delete point
    }
  }
  // line12
  if (Math.abs(nC - nB) > 0) {
    console.log('B')
    t = (nP - nB) / (nC - nB);
    v0 = plane2.Vertices.topRight
    v1 = plane2.Vertices.bottomRight
    if (t > 0 && t <= 1) {
      var point = new Array(3)
      point[0] = v0[0] + t * (v1[0] - v0[0])
      point[1] = v0[1] + t * (v1[1] - v0[1])
      point[2] = v0[2] + t * (v1[2] - v0[2])
      points.push(point)
      point = null
      delete point
    }
  }
  // line23
  if (Math.abs(nD - nC) > 0) {
    t = (nP - nC) / (nD - nC);
    v0 = plane2.Vertices.bottomRight
    v1 = plane2.Vertices.bottomLeft
    console.log('C', t, v0, v1)
    if (t > 0 && t <= 1) {
      var point = new Array(3)
      point[0] = v0[0] + t * (v1[0] - v0[0])
      point[1] = v0[1] + t * (v1[1] - v0[1])
      point[2] = v0[2] + t * (v1[2] - v0[2])
      points.push(point)
      point = null
      delete point
    }
  }
  // line30
  if (Math.abs(nA - nD) > 0) {
    console.log('D')
    t = (nP - nD) / (nA - nD);
    v0 = plane2.Vertices.bottomLeft
    v1 = plane2.Vertices.topLeft
    if (t > 0 && t <= 1) {
      var point = new Array(3)
      point[0] = v0[0] + t * (v1[0] - v0[0])
      point[1] = v0[1] + t * (v1[1] - v0[1])
      point[2] = v0[2] + t * (v1[2] - v0[2])
      points.push(point)
      point = null
      delete point
    }
  }
  return points
}

// #7 計算plane旋轉到XY平面的角度，併計算point旋轉到 XY平面的對應點
function rotateToXY(plane, point) {
  var vr = [
    plane.ImageOrientationPatient[0],
    plane.ImageOrientationPatient[1],
    plane.ImageOrientationPatient[2]
  ]
  // 投影XY 與 X 角度 (z軸旋轉)
  var l1 = Math.sqrt(vr[0] * vr[0] + vr[1] * vr[1])
  var theta1 = Math.acos(vr[0] / l1)
  // 投影XZ 與 X 角度 (y軸旋轉)
  var l2 = Math.sqrt(vr[0] * vr[0] + vr[2] * vr[2])
  var theta2 = Math.acos(vr[0] / l2)

  // y 轉
  var x1 = (point[0] - plane.Vertices.topLeft[0]) * Math.cos(theta1) + (point[2] - plane.Vertices.topLeft[2]) * Math.sin(theta1)
  var y1 = (point[1] - plane.Vertices.topLeft[1])
  var z1 = (point[2] - plane.Vertices.topLeft[2]) * Math.cos(theta1) - (point[0] - plane.Vertices.topLeft[0]) * Math.sin(theta1)
  // z 轉
  var x2 = x1 * Math.cos(theta2) - y1 * Math.sin(theta2)
  var y2 = x1 * Math.sin(theta2) + y1 * Math.cos(theta2)
  var z2 = z1

  return [x2 / plane.PixelSpacing[0], y2 / plane.PixelSpacing[1], z2]
}

function findPlaneEquation(topLeft, topRight, bottomLeft) {
  equation = {}
  equation.a = (topRight[1] - topLeft[1]) * (bottomLeft[2] - topLeft[2]) - (bottomLeft[1] - topLeft[1]) * (topRight[2] - topLeft[2])
  equation.b = (topRight[2] - topLeft[2]) * (bottomLeft[0] - topLeft[0]) - (bottomLeft[2] - topLeft[2]) * (topRight[0] - topLeft[0])
  equation.c = (topRight[0] - topLeft[0]) * (bottomLeft[1] - topLeft[1]) - (bottomLeft[0] - topLeft[0]) * (topRight[1] - topLeft[1])
  equation.d = -(equation.a * topLeft[0] + equation.b * topLeft[1] + equation.c * topLeft[2])

  return equation
}

function findRCSCoordinate(patient, equation, voxel) {
  var xAxis = [ // Xx Xy Xz axis ex: [1, 0, 0]
    patient.ImageOrientationPatient[0] * patient.PixelSpacing[0],
    patient.ImageOrientationPatient[1] * patient.PixelSpacing[0],
    patient.ImageOrientationPatient[2] * patient.PixelSpacing[0],
  ]
  var yAxis = [ // Yx Yy Yz axis ex: [0, 1, 0]
    patient.ImageOrientationPatient[3] * patient.PixelSpacing[1],
    patient.ImageOrientationPatient[4] * patient.PixelSpacing[1],
    patient.ImageOrientationPatient[5] * patient.PixelSpacing[1],
  ]
  var imgPosition = [
    patient.ImagePositionPatient[0],
    patient.ImagePositionPatient[1],
    patient.ImagePositionPatient[2],
  ]
  console.log('voxel', voxel)
  var voxelMatrix = [
  	parseFloat(voxel[0]),
  	parseFloat(voxel[1]),
  	0,
  	1,
  ]

  var affineMatrix = [
  	[xAxis[0], yAxis[0], 0, imgPosition[0]],
  	[xAxis[1], yAxis[1], 0, imgPosition[1]],
  	[xAxis[2], yAxis[2], 0, imgPosition[2]],
  	[       0,        0, 0,              0]
  ]

  // var patientCoord mat.Dense
  // patientCoord.Mul(affineMatrix, voxelMatrix)	
  // //fmt.Println("patientCoord: ", patientCoord)

  // point := Point{
  // 	int(patientCoord.At(0, 0)),
  // 	int(patientCoord.At(1, 0)),
  // 	int(patientCoord.At(2, 0)),
  // }

  return point
}


function loadDICOM(fileName) {
  return new Promise((resolve, reject) => {
    var oReq = new XMLHttpRequest();
    oReq.open("GET", fileName, true);
    oReq.responseType = "arraybuffer";
    oReq.onload = function (oEvent) {
      var arrayBuffer = oReq.response; // Note: not oReq.responseText

      if (arrayBuffer) {
        const data2 = new DataView(arrayBuffer);
        const dataSet = daikon.Series.parseImage(data2);
        resolve(dataSet)
      }
    };
    oReq.send(null);
  })
}

// #0 程式執行起點
var plane1, plane2;
loadDICOM('555.dcm').then((dataSet) => {
  console.log(dataSet)
  plane1 = FrameGeometry(dataSet)
  return loadDICOM('572.dcm')
}).then((dataSet) => {
  plane2 = FrameGeometry(dataSet)
  // // console.log(plane1)
  // // console.log(plane2)
  if (checkReferenceID(plane1, plane2)) {
    plane1.NormalVector = normalVector(plane1)
    plane2.NormalVector = normalVector(plane2)
    plane1.Vertices = vertices(plane1)
    plane2.Vertices = vertices(plane2)
    var equation = findPlaneEquation(plane1.Vertices.topLeft, plane1.Vertices.topRight, plane1.Vertices.bottomLeft)
    var coordiante1 = findRCSCoordinate(plane1, equation, plane1.ImagePositionPatient)
    //   // console.log(plane1.Vertices, plane2.Vertices)
    var points = intersectionLocalizer(plane1, plane2)
    //   // console.log(points)
    //   // console.log('start', rotateToXY(plane2, points[0]))
    //   // console.log('end', rotateToXY(plane2, points[1]))

    logToPage(rotateToXY(plane2, points[0])) // start point
    logToPage(rotateToXY(plane2, points[1])) // end point
  }
})

function dumpDataSet(instance) {
  var json = JSON.stringify(instance, undefined, 2);
  return '<pre><code id="code" class="prettyprint">' + json + '</code></pre>';
}

function logToPage(instance) {
  document.getElementById('dropZone').innerHTML += dumpDataSet(instance);
}