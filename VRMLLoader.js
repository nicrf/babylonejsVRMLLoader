(function (BABYLON) {
    var VRMLFileLoader = /** @class */ (function () {
        function VRMLFileLoader() {
			var _this = this;
            this.name = "vrml";
            this.extensions = ".wrl";
            this.forceLamberMaterial = true;
            this.debug = true;
            this.showInfo = true;
            this.useFlatMaterial = true;
            this.useRightHandedSystem = true;
            this.totalNode = 0;
            this.doneNode = 0;
            //this.useFlatMaterial = true;
            this.mesh = [];
            this.defines = {};
        }
        VRMLFileLoader.prototype.importMesh = function (meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
			scene.useGeometryIdsMap = true;
			scene.useMaterialMeshMap = true;
			scene.useClonedMeshMap = true;
			scene.useRightHandedSystem = this.useRightHandedSystem;
			engine.stopRenderLoop();
			//parse VRML
			if (this.debug === true ) {
				console.log("Parse the file");
			}
			var tree = vrmlParser.parse(data);
			data = null; //Free memory
			if (this.debug === true ) {
				console.log(tree);
			}
			this.totalNode = this.countNode(tree.nodeDefinitions);
			delete tree.nodeDefinitions; //Free memory
			if (this.debug === true ) {
				console.log("Total node find : " + this.totalNode);
			}
			for ( var i = 0, l = tree.length; i < l; i ++ ) {
				this.parseNode(tree[i]);
			}
			engine.runRenderLoop(function () {
					scene.render();
			});
			if (this.forceLamberMaterial) {
				scene.ambientColor = new BABYLON.Color3(1, 1, 1);
			}			
			return true;
        };
        VRMLFileLoader.prototype.load = function (scene, data, rootUrl) {
            var result = this.importMesh(null, scene, data, rootUrl, null, null, null);
            if (result) {
                scene.createDefaultCameraOrLight();
            }
            return result;
        };
        VRMLFileLoader.prototype.loadAssetContainer = function (scene, data, rootUrl, onError) {
			return this.importMesh(null, scene, data, rootUrl, container.meshes, null, null).then(function (result) {
                var container = new BABYLON.AssetContainer(scene);
                result.meshes.forEach(function (mesh) { return container.meshes.push(mesh); });
                container.removeAllFromScene();
                return container;
            });
        };

        VRMLFileLoader.prototype.countNode = function (obj) {
			var count = 0;
			for (var property in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, property)) {
					count++;
				}
			}
			return count;
		}
        VRMLFileLoader.prototype.parseNode = function (data,parent) {
			var name = "";	
			if (data.name) {
				name = data.name;	
			} else if (data.node){
				name = data.node;
			}
			if (this.debug === true ) {
				console.log("Parse an node " + data.node + " named " + name);
			}
			var object = parent;
			switch(data.node) {
				case 'Transform' :
				case 'Group' :									
					object =  new  BABYLON.TransformNode(name);
					if (parent !== undefined) {
						object.parent = parent;
					}
					var CoR_At = new BABYLON.Vector3(0, 0, 0);
					if (data.center) {
						CoR_At = new BABYLON.Vector3(data.center.x,data.center.y,data.center.z); //To be tested
					}
					if (data.translation) {
						var t = data.translation;
						object.position = new BABYLON.Vector3(t.x, t.y, t.z ); 
					}
					if (data.rotation) {
						var r = data.rotation;		
						object.rotationQuaternion = new BABYLON.Quaternion.RotationAxis( new BABYLON.Vector3(r.x, r.y, r.z ),r.radians);
					} else {
						object.rotationQuaternion = null;
						object.rotation = new BABYLON.Vector3(0,0,0);
					}					
					if (data.scale) {
						var s = data.scale;
						object.scaling = new BABYLON.Vector3(s.x, s.y, s.z );
					}
					this.doneNode++;
					if (this.showInfo) {
						console.log("Node complete "+ this.doneNode + " of " + this.totalNode);
					}
					break;
				case 'Shape':
					object = this.addShape(data,parent);
					break;
				case 'DirectionalLight':	//ambientIntensity 
					object = new BABYLON.DirectionalLight(name, new BABYLON.Vector3(data.direction.x, data.direction.y, data.direction.z));
					if (data.on) {
						object.setEnabled(data.on);
					}
					if (data.color) {
						object.diffuse = new BABYLON.Color3(data.color.x, data.color.y, data.color.z);
						object.specular = new BABYLON.Color3(data.color.x, data.color.y, data.color.z);
					}	
					if (data.intensity) {
						object.intensity = data.intensity;
					}					
					if (parent !== undefined) {
						object.parent = parent;
					}
					break;
				case 'PointLight':
					object = new BABYLON.PointLight(name, new BABYLON.Vector3(data.location.x, data.location.y, data.location.z));
					if (data.on) {
						object.setEnabled(data.on);
					}
					if (data.color) {
						object.diffuse = new BABYLON.Color3(data.color.x, data.color.y, data.color.z);
						object.specular = new BABYLON.Color3(data.color.x, data.color.y, data.color.z);
					}	
					if (data.intensity) {
						object.intensity = data.intensity;
					}					
					if (parent !== undefined) {
						object.parent = parent;
					}
					break;
				case 'IndexedFaceSet':
				case 'IndexedLineSet':
				case 'PointSet':
				case 'Sphere':
				case 'Cone':
				case 'Cylinder':
				case 'Box':
					object = this.getGeometry(data.geometry,parent);
					break;
				case 'Light':
				case 'AmbientLight':
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
					if (this.debug === true) {
						console.warn(data.node + " type node is not implemented");
					}
					break;
				case undefined:
					if (this.debug === true) {
						console.warn("Node is not defined");
					}
					break;				
			}
			if (data.children) {
				for ( var i = 0, l = data.children.length; i < l; i ++ ) {
					this.parseNode( data.children[ i ], object );
				}
			}	
					
		}
		
		 VRMLFileLoader.prototype.addShape = function (data,parent) {			
			var mat = this.loadMaterial(data,parent);
			var geometry = this.getGeometry(data.geometry,parent);//loadGeometry(data,parent,model);
			if (geometry && mat) {
				geometry.material = mat;
			} 
			return geometry;
		}
		
		VRMLFileLoader.prototype.loadMaterial = function loadMaterial(data,parent) {
			var appearance = data.appearance; //child??
			if (appearance) {
				var materialsInfo = appearance.material;
				var material;
				if (materialsInfo) {
					if (Array.isArray(materialsInfo)){
						//To be linked to mesh
						for (var i = 0, len = materialsInfo.length; i < len; i++) {
							material = this.buildMaterialColorize(materialInfo[i]);					
						}
					} else {
						if (this.forceLamberMaterial === true) {
							return this.buildMaterialColorize(materialsInfo);
						} else {
							console.warn("Texture not implemented");
						}
					}
				}
			}			
			//ImageTexture To Be Done
		}
		

		VRMLFileLoader.prototype.buildMaterialColorize = function (materialInfo) {	
			var mat = new BABYLON.StandardMaterial("",scene);		
			if (materialInfo.diffuseColor){
				mat.ambientColor =   new BABYLON.Color3(materialInfo.diffuseColor.x,materialInfo.diffuseColor.y, materialInfo.diffuseColor.z);
			}			
            /*if (materialInfo.diffuseColor){
				mat.diffuseColor =   new BABYLON.Color3(materialInfo.diffuseColor.x,materialInfo.diffuseColor.y, materialInfo.diffuseColor.z);
			}			
			if (materialInfo.emissiveColor){
				mat.emissiveColor =   new BABYLON.Color3(materialInfo.emissiveColor.x,materialInfo.emissiveColor.y, materialInfo.emissiveColor.z);
			}			
			if (materialInfo.specularColor){
				mat.specularColor =   new BABYLON.Color3(materialInfo.specularColor.x,materialInfo.specularColor.y, materialInfo.specularColor.z);
			}*/
			//ambientColor, texture to do
			if (materialInfo.transparency) {
				mat.alpha = materialInfo.transparency;
			}	
			return mat;
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
			if (this.useFlatMaterial===true){
				geometry.convertToFlatShadedMesh();
			}
			return geometry;
		}
			
        VRMLFileLoader.prototype.buildGeometry = function (data) {
			if (this.debug === true) {
				console.log("Shape as : "+ data.node);
			}
			var name = data.node;
			if (data.name) {
				name = data.name;
			}
			if ( data.node === 'Box' ) {
				var s = data.size;
				return new BABYLON.MeshBuilder.CreateBox(name, {
					height: s.y,
					width : s.x,
					depth : s.z
				},scene);
			} else if (data.node === 'Cylinder') { //data.radius, data.radius, data.height
				return new BABYLON.MeshBuilder.CreateCylinder(name, {
					height:data.height,
					diameterTop: data.radius,
					diameterBottom: data.radius
					},scene);
			} else if (data.node === 'Cone') {
				return new BABYLON.MeshBuilder.CreateCylinder(name, {
					height:data.height,
					diameterTop: data.radius,
					diameterBottom: data.radius
				},scene);			
			} else if (data.node === 'Sphere') {
				return new BABYLON.MeshBuilder.CreateSphere(name, {
					diameter: data.radius
					},scene); 
			} else if (data.node === 'PointSet') {	//To be test	
				var points = new BABYLON.Mesh(name,scene);
				var indices = [];
				var positions= [];
				var normals= [];
				if (data.coord) {
					for (var i = 0; i < indices.length; i ++ ) {
						points.push(data.coord.point[i].x,data.coord.point[i].y,data.coord.point[i].z);
						indices.push(i);
						normals.push(1,1,1);
					}
					var vertexData = new BABYLON.VertexData();
					vertexData.positions = positions;
					vertexData.indices = indices;
					vertexData.normals = normals;					
					vertexData.applyToMesh(points, true);				
				}			
				return points;
			} else if (data.node === 'IndexedLineSet') {
				var lines = [];
				if (data.coord) {

					for (var i = 0; i < data.coordIndex.length; i ++ ) {
						var indice = data.coordIndex[i];						
						lines.push([
							new BABYLON.Vector3(data.coord.point[indice[0]].x,data.coord.point[indice[0]].y,data.coord.point[indice[0]].z),
							new BABYLON.Vector3(data.coord.point[indice[1]].x,data.coord.point[indice[1]].y,data.coord.point[indice[1]].z),
                        ]);						
					}
				}
                var points = new BABYLON.MeshBuilder.CreateLineSystem(name,{lines: lines, updatable: true},scene);
				return points;
			} else if (data.node === 'IndexedFaceSet') {	//To be done
				var positions = [];
				var indices = [];
				var uvs = [];
				var faces = [];
				var face_uvs=[[0,0],[1,0],[1,1],[0,1]];
				if (name =="trap") {
					console.log(data);
				}
				if (data.coord) {
					// positions
					if ( data.texCoord) {
						uvs = data.texCoord.point;
					}
					for (var i = 0; i < data.coord.point.length; i ++ ) {
						/*if (!data.texCoord) {
							uvs.push(data.coord.point[i]); //No UVS supprot for now.
						}*/
						positions.push(data.coord.point[i].x,data.coord.point[i].y,data.coord.point[i].z);
					}
					delete data.coord; //Free memory
					delete data.texCoord; //Free memory
				}
				if (data.coordIndex && data.coordIndex.length && data.coordIndex.length>0) {
					//Bug when we got -1 coordIndex to separate indices for each polygon - To be done - But EPLAN do not created face with multiple polygone
					// indices from faces		  
					for (var f = 0; f < data.coordIndex.length; f++) {
						/* for(var j = 0; j < data.coordIndex[f].length; j++) {
						uvs=uvs.concat(face_uvs[j]);
					  }*/
					  for (i = 0; i < data.coordIndex[f].length - 2; i++) {
						  indices.push(data.coordIndex[f][0], data.coordIndex[f][i + 2], data.coordIndex[f][i + 1]);
					  }
					}
					delete data.coordIndex; //Free memory
				}
				var creaseAngle = data.creaseAngle ? data.creaseAngle : 2;
				//Empty array to contain calculated values or normals added
				var normals = [];
				//Calculations of normals added
				BABYLON.VertexData.ComputeNormals(positions, indices, normals);					
				var polygon = new BABYLON.Mesh(name,scene);
				polygon.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
				polygon.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
				polygon.setIndices(indices);
				polygon.computeWorldMatrix(true);					
				// polygon.forceSharedVertices();
				return polygon;
			}
		}
        return VRMLFileLoader;
    }());
    BABYLON.VRMLFileLoader = VRMLFileLoader;
    if (BABYLON.SceneLoader) {
        BABYLON.SceneLoader.RegisterPlugin(new VRMLFileLoader());
    }
})(BABYLON || (BABYLON = {}));