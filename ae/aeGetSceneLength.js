function getSceneLength(){
	var active = app.project.activeItem;
  return active.workAreaDuration;
}

module.exports = getSceneLength;
