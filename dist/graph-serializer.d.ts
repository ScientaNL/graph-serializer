/**
 * A scheme is in the context of our serializer defined as a pair of a serializer and a deserializer.
 */
export declare class Scheme {
    serializer: (v: any) => any;
    deserializer: (v: any) => any;
}
/**
 * This interface should define all decorator parameters you can supply to the @serializable decorator.
 */
export interface DescriptionSettings {
    scheme?: Scheme;
    serializedName?: string;
    postDeserialize?: Function;
}
/**
 * Property decorator storage.
 *
 * If you ever want to add a class decorator option, you can do so here. Be sure to also add your option to the
 * DescriptionSettings interface defined above, for autocompletion in your favourite IDE.
 */
export declare class PropertyDescription {
    scheme: Scheme;
    name: string;
    serializedName: string;
    constructor(propertyName: string, settings?: DescriptionSettings);
    /**
     * Add new property decorator settings here.
     *
     * @param {DescriptionSettings} settings
     * @returns {PropertyDescription}
     */
    setDecoration(settings: DescriptionSettings): PropertyDescription;
}
/**
 * Class decorator storage.
 *
 * If you ever want to add a class decorator option, you can do so here. Be sure to also add your option to the
 * DescriptionSettings interface defined above, for autocompletion in your favourite IDE.
 */
export declare class ClassDescription {
    postDeserialize: Function;
    properties: Map<string, PropertyDescription>;
    /**
     * Store decoration
     * @param {DescriptionSettings} settings
     * @returns {ClassDescription}
     */
    setDecoration(settings: DescriptionSettings): ClassDescription;
}
/**
 * Main decorator storage. This class will store and provide access to all decorators. An instance is instantiated
 * below.
 */
export declare class Store {
    private map;
    /**
     * Override Map getter. When no class description is found, we want to instantiate and return one. Class decorators
     * are optional, and this ensures we will get a default one when requested
     *
     * @param key
     * @returns {ClassDescription}
     */
    get(key: any): ClassDescription;
    /**
     * Setter
     * @param key
     * @param {ClassDescription} value
     */
    set(key: any, value: ClassDescription): void;
}
/**
 * Serializer. Converts a JSON serializable tree to an object instance.
 *
 * @param type
 * @param src
 * @returns {any}
 */
export declare function deserialize(type: any, src: any): any;
/**
 * Deserializer function. Converts an object to a JSON serializable graph.
 *
 * @param src
 * @returns {{[p: string]: any}}
 */
export declare function serialize(src: any): {
    [key: string]: any;
};
/**
 * Primitive scheme type.
 * The default scheme. This will return properties as-is on deserialize. This is exported as const because
 * the primitive scheme should never change.
 * @type {Scheme}
 */
export declare const primitive: Scheme;
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
export declare const date: Scheme;
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
export declare function array(childScheme?: Scheme): Scheme;
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
export declare function object(type: any): Scheme;
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
export declare function custom(serializer: (v: any) => any, deserializer: (v: any) => any): Scheme;
/**
 * Decorator function. This is the only function to decorate your typescript classes with; it servers as both a class
 * decorator and a property decorator.
 *
 * @param {DescriptionSettings} settings
 * @returns {any}
 */
export declare function serializable(settings?: DescriptionSettings): any;
/**
 * postDeserialize decorator. If you are using an AOT build of your project, the class annotation for the
 * serializer cannot be used because functions are not allowed in the class decorator.
 * Therefore, you should create a *static member function* for postDeserialization and annotate it with this function.
 *
 * @returns {any}
 */
export declare function postDeserialize(): any;
