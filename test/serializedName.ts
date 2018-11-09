import {expect} from 'chai';
import {deserialize, serializable, serialize} from "../src/graph-serializer";

describe('serializedName', () => {

    class MyTest {

        @serializable({
            serializedName: 'value'
        })
        public internalValue: string = 'initial';

        public set value(v:string) {
            throw new Error('Setter should not be called by serializer');
        }
        public get value():string {
            throw new Error('Getter should not be called by serializer');
        }
    }

    it('serialize', ()=>{
        const output = serialize(new MyTest());
        expect(output.value).to.equal('initial');
        expect(output.internalValue).to.equal(undefined);
    });

    it('deserialize', ()=>{
        const output = deserialize(MyTest,{
            value: 'test',
        });
        expect(output.internalValue).to.equal('test');
    });

});

describe('serializedName-inheritance', () => {

	abstract class AbstractMyTest {
		@serializable()
		public value: string;
	}

	class MyTestImplementation extends AbstractMyTest {
		@serializable({
			serializedName: 'value'
		})
		public internalValue: string = 'initial';

		public set value(v:string) {
			throw new Error('Setter should not be called by serializer');
		}
		public get value():string {
			throw new Error('Getter should not be called by serializer');
		}
	}

	it('deserialize', ()=>{
		const output = deserialize(MyTestImplementation,{
			value: 'test',
		});
		expect(output.internalValue).to.equal('test');
	});

	it('serialize', ()=>{
		const output = serialize(new MyTestImplementation());
		expect(output.value).to.equal('initial');
		expect(output.internalValue).to.equal(undefined);
	});
});

