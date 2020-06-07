let [nodeMajorVersion] = process.versions.node.split('.');
nodeMajorVersion = Number(nodeMajorVersion);

module.exports = () => {
	// use modules when supported without warnings
	return nodeMajorVersion >= 14;
};
