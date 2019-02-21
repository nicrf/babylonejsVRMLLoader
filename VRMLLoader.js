/**
* Simple VRML parser
* Use on https://github.com/bartmcleod/VrmlParser 
* Based on THREEJS VRMLLoader
*/
var BABYLON;
(function (BABYLON) {
    var VRMLFileLoader = /** @class */ (function () {
        function VRMLFileLoader() {
			var _this = this;
            this.name = "vrml";
            this.extensions = ".wrl";
            this.mesh = [];
            this.defines = {};
        }
        VRMLFileLoader.prototype.importMesh = function (meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
			//parse VRML
			var tree = vrmlParser.parse(data);

			console.log(tree);
			for ( var i = 0, l = tree.length; i < l; i ++ ) {
				this.parseNode(tree[i]);
			}
			console.log(this.defines);
        };
        VRMLFileLoader.prototype.load = function (scene, data, rootUrl) {
            var result = this.importMesh(null, scene, data, rootUrl, null, null, null);
            if (result) {
                scene.createDefaultCameraOrLight();
            }
            return result;
        };
        VRMLFileLoader.prototype.loadAssetContainer = function (scene, data, rootUrl, onError) {
            var container = new BABYLON.AssetContainer(scene);
            this.importMesh(null, scene, data, rootUrl, container.meshes, null, null);
            container.removeAllFromScene();
            return container;
        };

        VRMLFileLoader.prototype.parseNode = function (data,parent) {
			console.log("Parse an node " + data.node);
			if (data.name) {
				console.log("Parse an node " + data.name);
			}
			var object = parent;
			switch(data.node) {
				case 'Transform' :
				case 'Group' :
					var name = "";
					if (data.name) {
						name = data.name;
						//this.defines[ name ] = object;
					}
					object =  new  BABYLON.TransformNode(name);//BABYLON.Mesh.CreateBox(name, 0, scene);
					if (parent !== undefined) {
						object.parent = parent;
						if (data.translation) {
							var t = data.translation;
							object.locallyTranslate( new BABYLON.Vector3(t.x, t.y, t.z ));
						}
						if (data.rotation) {
							var r = data.rotation;						
							object.rotate(new BABYLON.Vector3(r.x, r.y, r.z ), r.w, BABYLON.Space.LOCAL);							
						}
						if (data.scale) {
							var s = data.scale;
							object.scaling = new BABYLON.Vector3(s.x, s.y, s.z );
						}					
					} else {
						if (data.translation) {
							var t = data.translation;
							object.position = new BABYLON.Vector3(t.x, t.y, t.z ); 
						}
						if (data.rotation) {
							var r = data.rotation;						
							object.rotationQuaternion = new BABYLON.Quaternion(r.x, r.y, r.z , r.w);						
						}
						if (data.scale) {
							var s = data.scale;
							object.scaling = new BABYLON.Vector3(s.x, s.y, s.z );
						}
					}
					
					break;
				case 'Shape':
					object = this.addShape(data,parent);
					/*if (object) {
						object.parent = parent;
						//this.push(object);
					}*/
					break;
				case 'Light':
				case 'AmbientLight':
				case 'PointLight':
				case 'Background':
				case "OrientationInterpolator":
				case "PositionInterpolator":
				case "Viewpoint":
				case "NavigationInfo":
				case "Text":
				case "Inline":
				case "Switch":
				case "TimeSensor":
				case "TouchSensor":
				default:
					console.warn(data.node + " type node is not implemented")
					break;
				case undefined:
					console.warn("Node is not defined")
					break;
			}
			if (data.children) {
				for ( var i = 0, l = data.children.length; i < l; i ++ ) {
					this.parseNode( data.children[ i ], object );
				}
			}			
		}
		
		 VRMLFileLoader.prototype.addShape = function (data,parent) {			
			var mat = null;// loadMaterial(data,parent,model);
			var geometry = this.getGeometry(data.geometry,parent);//loadGeometry(data,parent,model);
			if (geometry && mat) {
				/*return new xeogl.Mesh({
					geometry:geometry,
					material:mat
				});	*/
			} else if (geometry) {
				/*return new xeogl.Mesh({
					geometry:geometry
				});*/
			}
			return geometry;
		}
		
		 VRMLFileLoader.prototype.parseGeometry = function (data,parent) {		
			var geometrysInfo = data.geometry;
			if (geometrysInfo) {
				if (Array.isArray(geometrysInfo)){
					// group?
					var group = [];
					for (var i = 0, len = materialsInfo.length; i < len; i++) {
						var geometry = this.getGeometry(geometrysInfo[i],parent);
						group.push(geometry);
					}					
					return group;							
				} else {
					return this.getGeometry(geometrysInfo,parent);					
				}
			}			
		}
        VRMLFileLoader.prototype.getGeometry = function (data, parent) {
			var geometry = this.buildGeometry(data);
			if (geometry)
				geometry.parent = parent;
			return geometry;
		}
			
        VRMLFileLoader.prototype.buildGeometry = function (data) {
			console.log("Shape as : "+ data.node);
			var name = "";
			if (data.name) {
				name = data.name;
				//this.defines[ name] = shape;
			}
			if ( data.node === 'Box' ) {
				var s = data.size;
				return new BABYLON.MeshBuilder.CreateBox(name, {
					height: s.y,
					width : s.x,
					depth : s.z
				});;
			} else if (data.node === 'Cylinder') { //data.radius, data.radius, data.height
				return new BABYLON.MeshBuilder.CreateCylinder(name, {
					height:data.height,
					diameterTop: data.radius,
					diameterBottom: data.radius
					});
			} else if (data.node === 'Cone') {
				return new BABYLON.MeshBuilder.CreateCylinder(name, {
					height:data.height,
					diameterTop: data.radius,
					diameterBottom: data.radius
				});			
			} else if (data.node === 'Sphere') {
				return new BABYLON.MeshBuilder.CreateSphere(name, {
					diameter: data.radius
					}); 
			} else if (data.node === 'PointSet') {	//To be test
				//var points = [];
				var indices = []; 
				var points = new  BABYLON.TransformNode(name);
				if (data.coord) {
					indices = data.coordIndex.toString().split(",");
					for (var i = 0; i < indices.length; i ++ ) { //Not sure
						//points.push(new BABYLON.Mesh("point");point.position = new BABYLON.Vector3(data.coord.point[i].x,data.coord.point[i].y,data.coord.point[i].z))
					}					
				}
				return points;
			} else if (data.node === 'IndexedLineSet') {	//To be test
				var positions = [];
				var points = new  BABYLON.TransformNode(name);
				if (data.coord) {
					//indices = data.coordIndex.toString().split(",");
					for (var i = 0; i < data.coordIndex.length; i ++ ) {
						var indice = data.coordIndex[i];
						
						var point =  new BABYLON.Mesh.CreateLines(name + "_" + i, [
							new BABYLON.Vector3(data.coord.point[indice[0]].x,data.coord.point[indice[0]].y,data.coord.point[indice[0]].z),
							new BABYLON.Vector3(data.coord.point[indice[1]].x,data.coord.point[indice[1]].y,data.coord.point[indice[1]].z),
							]).parent = points;
						
					}
				}
				if (points.convertToUnIndexedMesh)
					points.convertToUnIndexedMesh();
				return points;
			} else if (data.node === 'IndexedFaceSet') {	//To be done
				var positions = [];
				var indices = [];
				var faces = [];
				var customMesh = new BABYLON.Mesh(name, scene);
				if (data.coord) {

					for (var i = 0; i < data.coord.point.length; i ++ ) {
						positions.push(data.coord.point[i].x,data.coord.point[i].y,data.coord.point[i].z);
					}
					/*for (var i = 0; i < data.coordIndex.length; i ++ ) {
						indices.push(data.coordIndex[i].join(", "));
					}*/
					if (data.ccw && data.ccw === false)
						console.error("CCW")
					var skip = 0;
					for ( var i = 0, j = data.coordIndex.length; i < j; i ++ ) {
						var indexes = data.coordIndex[i];
						skip = 0;
						while (indexes.length >= 3 && skip < (indexes.length - 2)) {
							var a = indexes[0];
							var b = indexes[skip + (data.ccw ? 1 : 2)];
							var c = indexes[skip + (data.ccw ? 2 : 1)];
							skip++;
							faces.push(a, b, c);
						}
					}
					indices = faces.toString().split(",");
					var creaseAngle = data.creaseAngle ? data.creaseAngle : 2;
					//Empty array to contain calculated values or normals added
					var normals = [];

					//Calculations of normals added
					//BABYLON.VertexData.ComputeNormals(positions, indices, normals);
					var vertexData = new BABYLON.VertexData();
					vertexData.positions = positions;
					vertexData.indices = indices; 
					//vertexData.normals = normals; 
					vertexData.applyToMesh(customMesh);

				}
				customMesh.convertToUnIndexedMesh();
				return customMesh;
			}
		}
        return VRMLFileLoader;
    }());
    BABYLON.VRMLFileLoader = VRMLFileLoader;
    if (BABYLON.SceneLoader) {
        BABYLON.SceneLoader.RegisterPlugin(new VRMLFileLoader());
    }
})(BABYLON || (BABYLON = {}));