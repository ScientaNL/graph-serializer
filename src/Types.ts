import {Scheme} from "./Scheme";
import {deserialize, serialize} from "./Serializer";

/**
 * Primitive, the default scheme. This will return properties as-is on deserialize. This is exported as const because
 * the primitive scheme should never change.
 * @type {Scheme}
 */
export const primitive = new Scheme();

/**
 * Date scheme. This scheme will properly serialize and deserialize javascript Date objects.
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

