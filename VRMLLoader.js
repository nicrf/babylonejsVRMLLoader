(function (BABYLON) {
    var VRMLFileLoader = /** @class */ (function () {
        function VRMLFileLoader() {
			var _this = this;
            this.name = "vrml";
            this.extensions = ".wrl";
            this.forceLamberMaterial = true;
            this.debug = false;
            this.mesh = [];
            this.defines = {};
        }
        VRMLFileLoader.prototype.importMesh = function (meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
			scene.useGeometryIdsMap = true;
			scene.useMaterialMeshMap = true;
			scene.useClonedMeshMap = true;
			engine.stopRenderLoop();
			//parse VRML
			var tree = vrmlParser.parse(data);

			for ( var i = 0, l = tree.length; i < l; i ++ ) {
				this.parseNode(tree[i]);
			}
			engine.runRenderLoop(function () {
					scene.render();
			});
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
			if (this.debug === true ) {
				console.log("Parse an node " + data.node);
				if (data.name) {
					console.log("Parse an node " + data.name);
				}
			}
			var object = parent;
			switch(data.node) {
				case 'Transform' :
				case 'Group' :
					var name = "";
					if (data.name) {
						name = data.name;
					}
					object =  new  BABYLON.TransformNode(name);//BABYLON.Mesh.CreateBox(name, 0, scene);
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
					break;
				case 'Shape':
					object = this.addShape(data,parent);
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
			var mat = new BABYLON.StandardMaterial();			
            if (materialInfo.diffuseColor){
				mat.diffuseColor =   new BABYLON.Color3(materialInfo.diffuseColor.x,materialInfo.diffuseColor.y, materialInfo.diffuseColor.z);
			}			
			if (materialInfo.emissiveColor){
				mat.emissiveColor =   new BABYLON.Color3(materialInfo.emissiveColor.x,materialInfo.emissiveColor.y, materialInfo.emissiveColor.z);
			}			
			if (materialInfo.specularColor){
				mat.specularColor =   new BABYLON.Color3(materialInfo.specularColor.x,materialInfo.specularColor.y, materialInfo.specularColor.z);
			}
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
				var points = new BABYLON.Mesh(name);
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
                var points = new BABYLON.MeshBuilder.CreateLineSystem(name,{lines: lines, updatable: true});
				return points;
			} else if (data.node === 'IndexedFaceSet') {	//To be done
				var positions = [];
				var indices = [];
				var uvs = [];
				var faces = [];
				var face_uvs=[[0,0],[1,0],[1,1],[0,1]];

				if (data.coord) {
					// positions
					if ( data.texCoord) {
						uvs = data.texCoord.point;
					}
					for (var i = 0; i < data.coord.point.length; i ++ ) {
						if (!data.texCoord) {
							uvs.push(data.coord.point[i]);
						}
						positions.push(data.coord.point[i].x,data.coord.point[i].y,data.coord.point[i].z);
					}
				}	
					// indices from faces		  
					for (var f = 0; f < data.coordIndex.length; f++) {
					  for(var j = 0; j < data.coordIndex[f].length; j++) {
						uvs=uvs.concat(face_uvs[j]);
					  }
					  for (i = 0; i < data.coordIndex[f].length - 2; i++) {
						  indices.push(data.coordIndex[f][0], data.coordIndex[f][i + 2], data.coordIndex[f][i + 1]);
					  }
					}
					var creaseAngle = data.creaseAngle ? data.creaseAngle : 2;
					//Empty array to contain calculated values or normals added
					var normals = [];
					//Calculations of normals added
					BABYLON.VertexData.ComputeNormals(positions, indices, normals);					
					var polygon = new BABYLON.Mesh(name);
					polygon.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
					polygon.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
					polygon.setIndices(indices);
					polygon.computeWorldMatrix(true);
					//polygon.convertToFlatShadedMesh();
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