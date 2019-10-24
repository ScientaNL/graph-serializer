import {expect} from 'chai';
import {date, deserialize, serializable, serialize} from "../src/graph-serializer";

describe('Dates', () => {

	class TestDate {
		@serializable({scheme: date})
		undefinedDate: Date;

		@serializable({scheme: date})
		nullDate: Date = null;

		@serializable({scheme: date})
		utcDate: Date = new Date('1982-02-07T09:15:03.123Z');

		// Same date but in Europe/Amsterdam timezone
		@serializable({scheme: date})
		w3cDate: Date = new Date('1982-02-07T10:15:03.123+01:00');
	}

	it('sane', () => {
		let output = new TestDate();
		expect(output.utcDate.getTime()).to.equal(output.w3cDate.getTime());
	});

	it('serialize', () => {
		let output = serialize(new TestDate());
		expect(output.undefinedDate).to.equal(undefined);
		expect(output.nullDate).to.equal(null);
		expect(output.utcDate).to.equal('1982-02-07T09:15:03.123Z');
		expect(output.w3cDate).to.equal('1982-02-07T09:15:03.123Z');
		expect(output.utcDate).to.equal(output.w3cDate); // <-- sanity check
	});

	it('deserialize', () => {
		let output = deserialize(TestDate, {
			nullDate: null,
			utcDate: '2018-01-01T09:15:03.123Z',
			w3cDate: '2018-01-01T09:15:03.123+00:00'
		});
		expect(output).to.be.instanceOf(TestDate);
		expect(output.utcDate).to.be.instanceOf(Date);
		expect(output.undefinedDate).to.equal(undefined);
		expect(output.nullDate).to.equal(null);
		expect(output.utcDate.toJSON()).to.equal('2018-01-01T09:15:03.123Z');
		expect(output.w3cDate.toJSON()).to.equal('2018-01-01T09:15:03.123Z');
		expect(output.utcDate.getTime()).to.equal(output.w3cDate.getTime()); // <-- sanity check
	});

});
