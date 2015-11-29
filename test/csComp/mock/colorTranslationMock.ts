module ColorTranslationMock {
	export class MockColorTranslation {
		then = function(translation) {
			translation('color');
		};
		//constructor() {}
	};
}