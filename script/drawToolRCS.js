(function(){
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
      console.log('ReferenceUID different')
      return false
    }
    if (!source.ImageOrientationPatient || !destination.ImageOrientationPatient) {
      console.log('ImageOrientationPatient not exist')
      return false
    }
    if (JSON.stringify(source.ImageOrientationPatient) === JSON.stringify(destination.ImageOrientationPatient)) {
      console.log('Same ImageOrientation')
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
      // console.log('A', t, v0, v1)
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
      // console.log('B')
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
      // console.log('C', t, v0, v1)
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
      // console.log('D')
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
  
  function epsilonToZero(v) {
    if(Math.abs(v) < Math.pow(10, -5)) {
      return 0
    } else {
      return v
    }
  }
  
  function rotateX (v, theta) {
    return [
      v[0],
      v[1]*Math.cos(theta) - v[2] * Math.sin(theta),
      v[1]*Math.sin(theta) + v[2] * Math.cos(theta)
    ]
  }
  function rotateY (v, theta) {
    return [
      v[0]*Math.cos(theta) + v[2]* Math.sin(theta),
      v[1],
      v[2]*Math.cos(theta) - v[0] * Math.sin(theta)
    ]
  }
  function rotateZ (v, theta) {
    return [
      v[0]*Math.cos(theta) - v[1]*Math.sin(theta),
      v[0]*Math.sin(theta) + v[1]*Math.cos(theta),
      v[2]
    ]
  }
  
  
  function vectorLength (v) {
    return Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])
  }
  
  function crossProduct(from, to) {
    var n = new Array(3)
    n[0] = from[1] * to[2] - from[2] * to[1]
    n[1] = from[2] * to[0] - from[0] * to[2]
    n[2] = from[0] * to[1] - from[1] * to[0]
    return n
  }
  
  
  // #7 計算plane旋轉到XY平面的角度，併計算point旋轉到 XY平面的對應點
  function rotateToXY_a (plane, point) {
    var vr = [
      plane.ImageOrientationPatient[0],
      plane.ImageOrientationPatient[1],
      plane.ImageOrientationPatient[2]
    ]
    var vc = [
      plane.ImageOrientationPatient[3],
      plane.ImageOrientationPatient[4],
      plane.ImageOrientationPatient[5]
    ]
    if (dotProduct(vr, [1,0,0]) !== 0) {
      var l1 = Math.sqrt(vr[0] * vr[0] + vr[1] * vr[1])
      var theta1 = Math.acos(vr[0]/l1)
      var result
      var l2 = Math.sqrt(vr[1] * vr[1] + vr[2] * vr[2])
      if (l2 === 0) {
        var theta = Math.acos(vc[1])
        if (crossProduct(vc, [0,1,0])[0] < 0){
          theta1 = -1 * theta1
        }
        result = rotateX([
          point[0] - plane.Vertices.topLeft[0],
          point[1] - plane.Vertices.topLeft[1],
          point[2] - plane.Vertices.topLeft[2]
        ],theta1)
      } else {
        var theta1 = Math.acos(vr[1]/l2)
        if (crossProduct(vr, [vr[0],Math.sqrt(1-vr[0]*vr[0]),0])[0] < 0){
          theta1 = -1 * theta1
        }
        var theta2 = Math.acos(vr[0])
        if (crossProduct([vr[0],Math.sqrt(1-vr[0]*vr[0]),0], [1,0,0])[2] < 0){
          theta2 = -1 * theta2
        }
        // 計算vc傳後與(0,1,0)角度，決定是否翻轉
        var vc_new = rotateZ(rotateX(vc,theta1), theta2)
        var theta3 = Math.acos(dotProduct(vc_new, [0,1,0])/vectorLength(vc_new))
        if (crossProduct(vc_new, [0,1,0])[0] < 0) {
          theta3 = -1 * theta3
        }
        result = rotateX(rotateZ(rotateX([
          point[0] - plane.Vertices.topLeft[0],
          point[1] - plane.Vertices.topLeft[1],
          point[2] - plane.Vertices.topLeft[2]
        ],theta1), theta2), theta3)
      }
      return [epsilonToZero(result[0]/plane.PixelSpacing[0]), epsilonToZero(result[1]/plane.PixelSpacing[1]), epsilonToZero(result[2])]
    } else {
      // (x旋轉,與z軸夾角)
      var l1 = Math.sqrt(vr[0] * vr[0] + vr[1] * vr[1] + vr[2] * vr[2])
      var theta1 = Math.acos(vr[2]/l1)
      if (crossProduct(vr, [0,0,1])[0] < 0) {
        theta1 = -1 * theta1
      }
      // (y旋轉)
      var theta2 = Math.PI/2
      var theta3 = 0
      // 計算vc傳後與(0,1,0)角度，決定是否翻轉
      var vc_new = rotateY(rotateX(vc,theta1), theta2)
      if (vc_new[1] < 0) {
        // 翻轉 Math.PI
        theta3 = Math.PI
      }
      var result = rotateX(rotateY(rotateX([
        point[0] - plane.Vertices.topLeft[0],
        point[1] - plane.Vertices.topLeft[1],
        point[2] - plane.Vertices.topLeft[2]
      ],theta1), theta2), theta3)
      return [epsilonToZero(result[0]/plane.PixelSpacing[0]), epsilonToZero(result[1]/plane.PixelSpacing[1]), epsilonToZero(result[2])]
    }
  }

  function postDicomRCSCoordination (planeDataSet1, planeDataSet2) {
    const plane2 = FrameGeometry(planeDataSet1)
    const plane1 = FrameGeometry(planeDataSet2)
    const result = new Array(2)
    const resultPlane1 = new Array(4)
    const resultPlane2 = new Array(4)
    if (checkReferenceID(plane1, plane2)) {
      plane1.NormalVector = normalVector(plane1)
      plane2.NormalVector = normalVector(plane2)
      plane1.Vertices = vertices(plane1)
      plane2.Vertices = vertices(plane2)
      // to plane2
      const points1 = intersectionLocalizer(plane1, plane2)
      const rs1 = rotateToXY_a(plane2, points1[0])
      const re1 = rotateToXY_a(plane2, points1[1])
      resultPlane1[0] = rs1[0]
      resultPlane1[1] = rs1[1]
      resultPlane1[2] = re1[0]
      resultPlane1[3] = re1[1]
      result[0] = resultPlane1
      // to plane1
      const points2 = intersectionLocalizer(plane2, plane1)
      const rs2 = rotateToXY_a(plane1, points2[0])
      const re2 = rotateToXY_a(plane1, points2[1])
      resultPlane2[0] = rs2[0]
      resultPlane2[1] = rs2[1]
      resultPlane2[2] = re2[0]
      resultPlane2[3] = re2[1]
      result[1] = resultPlane2
    } else {
      console.log('dicom tag error')
    }
    return result
  }

  window.postDicomRCSCoordination = postDicomRCSCoordination
})()