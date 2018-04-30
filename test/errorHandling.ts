import {expect} from 'chai';
import {array, deserialize, object, serializable} from "../src/graph-serializer";

describe('Error reporting', () => {

	describe('deserialize type error', () => {

		expect(function(){
			deserialize(null,{});
		}).to.throw(TypeError);

	});

});
