/**
 * A scheme is in the context of our serializer defined as a pair of a serializer and a deserializer.
 */
export class Scheme {
	public serializer: (v: any) => any = (v: any) => v;
	public deserializer: (v: any) => any = (v: any) => v;
}

/**
 * This interface should define all decorator parameters you can supply to the @serializable decorator.
 */
export interface DescriptionSettings {
	scheme?: Scheme,
	serializedName?: string,
	postDeserialize?: Function
}

/**
 * Property decorator storage.
 *
 * If you ever want to add a class decorator option, you can do so here. Be sure to also add your option to the
 * DescriptionSettings interface defined above, for autocompletion in your favourite IDE.
 */
export class PropertyDescription {

	public scheme: Scheme;
	public name: string;
	public serializedName: string;

	public constructor(propertyName: string, settings: DescriptionSettings = {}) {
		this.name = propertyName;
		this.setDecoration(settings);
	}

	/**
	 * Add new property decorator settings here.
	 *
	 * @param {DescriptionSettings} settings
	 * @returns {PropertyDescription}
	 */
	public setDecoration(settings: DescriptionSettings): PropertyDescription {
		this.scheme = typeof settings.scheme === 'undefined'
			? new Scheme()
			: settings.scheme;
		this.serializedName = typeof settings.serializedName === 'undefined'
			? this.name
			: settings.serializedName;
		return this;
	}
}

/**
 * Class decorator storage.
 *
 * If you ever want to add a class decorator option, you can do so here. Be sure to also add your option to the
 * DescriptionSettings interface defined above, for autocompletion in your favourite IDE.
 */
export class ClassDescription {

	public postDeserialize: Function = () => {};
	public properties: Map<string, PropertyDescription> = new Map();

	/**
	 * Store decoration
	 * @param {DescriptionSettings} settings
	 * @returns {ClassDescription}
	 */
	public setDecoration(settings: DescriptionSettings): ClassDescription {
		if (typeof settings === 'undefined')
			return this;
		this.postDeserialize = typeof settings.postDeserialize === 'undefined'
			? () => { }
			: settings.postDeserialize;
		return this;
	}
}

/**
 * Main decorator storage. This class will store and provide access to all decorators. An instance is instantiated
 * below.
 */
export class Store {

	private map:Map<any, ClassDescription> = new Map();

	/**
	 * Override Map getter. When no class description is found, we want to instantiate and return one. Class decorators
	 * are optional, and this ensures we will get a default one when requested
	 *
	 * @param key
	 * @returns {ClassDescription}
	 */
	public get(key: any): ClassDescription {
		if (!this.map.has(key)) {
			this.map.set(key, new ClassDescription());
		}
		return this.map.get(key);
	}

}

/**
 * Store object to hold our configuration. This needs not be exported because is should only be used internally.
 * @type {Store}
 */
const store = new Store();

/**
 * Serializer. Converts a JSON serializable tree to an object instance.
 *
 * @param type
 * @param src
 * @returns {any}
 */
export function deserialize(type: any, src: any): any {

	if(src === null)
		return null;

	let ret = new type();

	let isDerivedClass = Object.getPrototypeOf(type) instanceof Function;
	if(isDerivedClass) {
		let extendedType = Object.getPrototypeOf(Object.getPrototypeOf(new type())).constructor;
		Object.assign(ret, deserialize(extendedType,src));
	}

	store.get(type).properties.forEach((property: PropertyDescription, propertyName: string) => {
		if(typeof src[property.serializedName] !== 'undefined') {
			ret[propertyName] = property.scheme.deserializer(src[property.serializedName]);
		}
	});

	store.get(type).postDeserialize(ret);

	return ret;
}

/**
 * Deserializer function. Converts an object to a JSON serializable graph.
 *
 * @param src
 * @returns {{[p: string]: any}}
 */
export function serialize(src: any): { [key: string]: any } {
	let ret: { [key: string]: any } = {};

	//parent
	if(Object.getPrototypeOf(Object.getPrototypeOf(src)) !== null) {
		if(Object.getPrototypeOf(Object.getPrototypeOf(src)).constructor !== Object) {
			let superClass = new (Object.getPrototypeOf(Object.getPrototypeOf(src)).constructor)();
			Object.assign(ret,serialize(superClass));
		}
	}

	store.get(src.constructor).properties.forEach((property:PropertyDescription,propertyName:string) => {
		ret[property.serializedName] = property.scheme.serializer(src[propertyName]);
	});

	return ret;
}


/**
 * Primitive scheme type.
 * The default scheme. This will return properties as-is on deserialize. This is exported as const because
 * the primitive scheme should never change.
 * @type {Scheme}
 */
export const primitive = new Scheme();

/**
 * Date scheme type.
 * This scheme will properly serialize and deserialize javascript Date objects.
 *
 * Example usage:
 * ```
 * class TestClass {
 *  @serializable(date)
 *  public children: Date;
 * }
 * ```
 *
 * @type {Scheme}
 */
export const date = (function(){
	let scheme = new Scheme();
	scheme.serializer = (v:Date) => (v instanceof Date) ? v.toJSON() : v;
	scheme.deserializer = (v:string) => (typeof v === 'string') ? new Date(v) : v;
	return scheme;
})();

/**
 * Array scheme type
 * The array function will apply a scheme to all of its children.
 *
 * Example usage:
 * ```
 * class TestClass {
 *  @serializable(array())
 *  public children: string[];
 * }
 * ```
 *
 * @param {Scheme} childScheme
 * @returns {Scheme}
 */
export function array(childScheme: Scheme = primitive) {
	let scheme = new Scheme();
	scheme.serializer = (v: any) => {
		return v.map((w: any) => childScheme.serializer(w))
	};
	scheme.deserializer = (v: any) => {
		if(v === undefined) return v;
		return v.map((w: any) => childScheme.deserializer(w))
	};
	return scheme;
}

/**
 * Object scheme type
 * The object function will serialize a nested object
 *
 * Example usage:
 * ```
 * class A { name: string }
 * class B {
 *   @serializable(object(A))
 *   public nestedObject: A;
 * }
 * ```
 *
 * @param type
 * @returns {Scheme}
 */
export function object(type: any): Scheme {
	let scheme = new Scheme();
	scheme.serializer = (v:any) => serialize(v);
	scheme.deserializer = (v:any) => deserialize(type,v);
	return scheme;
}

/**
 * Custom scheme type
 * The custom function allows you to create your own serializer functionality. Used in polymorph types and arrays.
 *
 * Example usage:
 * ```
 * class A { public type = 'a'; }
 * class B { public type = 'b'; }
 * class TestClass {
 *  @serializable(custom(
 *      (v:any)=>v,
 *      (v:any) => deserialize({
 *          'a':A,
 *          'b':B
 *      }[v.type],v)
 *  ))
 *  public test: A|B;
 * }
 * ```
 *
 * @param {(v: any) => any} serializer
 * @param {(v: any) => any} deserializer
 * @returns {Scheme}
 */
export function custom(serializer: (v: any) => any, deserializer: (v: any) => any): Scheme {
	let scheme = new Scheme();
	scheme.serializer = serializer;
	scheme.deserializer = deserializer;
	return scheme;
}


/**
 * Decorator function. This is the only function to decorate your typescript classes with; it servers as both a class
 * decorator and a property decorator.
 *
 * @param {DescriptionSettings} settings
 * @returns {any}
 */
export function serializable(settings: DescriptionSettings = {}): any {

	return function(type:any, propertyName: string){

		// Class decorator
		if(arguments.length === 1) {
			store.get(type).setDecoration(settings);
		}

		// Property decorator
		else if(arguments.length === 3) {
			store.get(type.constructor).properties.set(propertyName, new PropertyDescription(propertyName, settings));
		}

		else {
			throw new Error("Invalid decorator");
		}
	};
}
