# Simple VRML parser for BabylonJS

Use and based on https://github.com/bartmcleod/VrmlParser 

Based on THREEJS VRMLLoader

## Todo

- Why it is mirror?
- Material texure (for now, it force lambert material)
- Other Node :
  - Background
  - OrientationInterpolator
  - PositionInterpolator
  - Viewpoint
  - NavigationInfo
  - Text
  - Inline		
  - Switch
  - TimeSensor
  - TouchSensor
  - Annimation
  - Extrude face	
- Faceset Data :
  - separe polygon (-1)
  - UVS
- Zip compression for big mesh

## Try

Add these script :

`<script src="VRMLLoader.js"></script>

 <script src="vrml.js"></script>`

To load an scene :

`BABYLON.SceneLoader.Append("", "your_model.wrl", scene, function (scene) {});		`

To load a mesh :

`BABYLON.SceneLoader.ImportMesh("", "", "your_model.wrl", scene, function () {});`
