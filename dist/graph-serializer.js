var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define("Scheme", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Scheme = /** @class */ (function () {
        function Scheme() {
            this.serializer = function (v) { return v; };
            this.deserializer = function (v) { return v; };
        }
        return Scheme;
    }());
    exports.Scheme = Scheme;
});
define("Store", ["require", "exports", "typescript-map", "Scheme"], function (require, exports, typescript_map_1, Scheme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Property decorator storage class
     */
    var PropertyDescription = /** @class */ (function () {
        function PropertyDescription(propertyName, settings) {
            if (settings === void 0) { settings = {}; }
            this.name = propertyName;
            this.setDecoration(settings);
        }
        /**
         * Add new property decorator settings here.
         *
         * @param {{[p: string]: any}} settings
         * @returns {PropertyDescription}
         */
        PropertyDescription.prototype.setDecoration = function (settings) {
            this.scheme = typeof settings.scheme === 'undefined'
                ? new Scheme_1.Scheme()
                : settings.scheme;
            this.serializedName = typeof settings.serializedName === 'undefined'
                ? this.name
                : settings.serializedName;
            return this;
        };
        return PropertyDescription;
    }());
    exports.PropertyDescription = PropertyDescription;
    /**
     * Class decorator storage
     */
    var ClassDescription = /** @class */ (function () {
        function ClassDescription() {
            this.postDeserialize = function () {
            };
            this.properties = new typescript_map_1.TSMap();
        }
        ClassDescription.prototype.setDecoration = function (settings) {
            if (typeof settings === 'undefined')
                return this;
            this.postDeserialize = typeof settings.postDeserialize === 'undefined'
                ? function () { }
                : settings.postDeserialize;
            return this;
        };
        return ClassDescription;
    }());
    exports.ClassDescription = ClassDescription;
    /**
     * Main decorator storage. This class will store and provide access to all decorators.
     */
    var Store = /** @class */ (function (_super) {
        __extends(Store, _super);
        function Store() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * Override Map getter. When no class description is found, we want to instantiate and return one. Class decorators
         * are optional, and this ensures we will get a default one when requested
         *
         * @param key
         * @returns {ClassDescription}
         */
        Store.prototype.get = function (key) {
            if (!this.has(key))
                this.set(key, new ClassDescription());
            return _super.prototype.get.call(this, key);
        };
        return Store;
    }(typescript_map_1.TSMap));
    exports.Store = Store;
    exports.store = new Store();
});
define("Decorators", ["require", "exports", "Store"], function (require, exports, Store_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Serializable decorator. The decorator may receive an object with settings. Example usage:
     *
     * ```
     * @serializable({
     *      postDeserialize: function(obj){ [...] }
     * })
     * class ExampleClass {
     *  @serializable()
     *  public name: string;
     *
     *  @serializable({
     *      serializedName: tags
     *      scheme: array()
     *  })
     *  public tagArr: string[];
     * }
     * ```
     *
     */
    function serializable(settings) {
        if (settings === void 0) { settings = {}; }
        return function (type, propertyName) {
            // Class decorator
            if (arguments.length === 1) {
                Store_1.store.get(type).setDecoration(settings);
            }
            // Property decorator
            else if (arguments.length === 3) {
                Store_1.store.get(type.constructor).properties.set(propertyName, new Store_1.PropertyDescription(propertyName, settings));
            }
            else {
                throw new Error("Invalid decorator");
            }
        };
    }
    exports.serializable = serializable;
});
define("Serializer", ["require", "exports", "Store"], function (require, exports, Store_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Serializer. Converts a JSON serializable tree to an object instance.
     *
     * @param type
     * @param src
     * @returns {any}
     */
    function deserialize(type, src) {
        var ret = new type();
        var isDerivedClass = Object.getPrototypeOf(type) instanceof Function;
        if (isDerivedClass) {
            var extendedType = Object.getPrototypeOf(Object.getPrototypeOf(new type())).constructor;
            Object.assign(ret, deserialize(extendedType, src));
        }
        Store_2.store.get(type).properties.forEach(function (property, propertyName) {
            ret[propertyName] = property.scheme.deserializer(src[property.serializedName]);
        });
        Store_2.store.get(type).postDeserialize(ret);
        return ret;
    }
    exports.deserialize = deserialize;
    /**
     * Deserializer function. Converts an object to a JSON serializable graph.
     *
     * @param src
     * @returns {{[p: string]: any}}
     */
    function serialize(src) {
        var ret = {};
        //parent
        if (Object.getPrototypeOf(Object.getPrototypeOf(src)).constructor !== Object) {
            var superClass = new (Object.getPrototypeOf(Object.getPrototypeOf(src)).constructor)();
            Object.assign(ret, serialize(superClass));
        }
        Store_2.store.get(src.constructor).properties.forEach(function (property, propertyName) {
            ret[property.serializedName] = property.scheme.serializer(src[propertyName]);
        });
        return ret;
    }
    exports.serialize = serialize;
});
define("Types", ["require", "exports", "Scheme", "Serializer"], function (require, exports, Scheme_2, Serializer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Primitive, the default scheme. This will return properties as-is on deserialize. This is exported as const because
     * the primitive scheme should never change.
     * @type {Scheme}
     */
    exports.primitive = new Scheme_2.Scheme();
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
    exports.date = (function () {
        var scheme = new Scheme_2.Scheme();
        scheme.serializer = function (v) { return (v instanceof Date) ? v.toJSON() : v; };
        scheme.deserializer = function (v) { return (typeof v === 'string') ? new Date(v) : v; };
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
    function array(childScheme) {
        if (childScheme === void 0) { childScheme = exports.primitive; }
        var scheme = new Scheme_2.Scheme();
        scheme.serializer = function (v) {
            return v.map(function (w) { return childScheme.serializer(w); });
        };
        scheme.deserializer = function (v) {
            if (v === undefined)
                return v;
            return v.map(function (w) { return childScheme.deserializer(w); });
        };
        return scheme;
    }
    exports.array = array;
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
    function object(type) {
        var scheme = new Scheme_2.Scheme();
        scheme.serializer = function (v) { return Serializer_1.serialize(v); };
        scheme.deserializer = function (v) { return Serializer_1.deserialize(type, v); };
        return scheme;
    }
    exports.object = object;
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
    function custom(serializer, deserializer) {
        var scheme = new Scheme_2.Scheme();
        scheme.serializer = serializer;
        scheme.deserializer = deserializer;
        return scheme;
    }
    exports.custom = custom;
});
define("graph-serializer", ["require", "exports", "Scheme", "Store", "Types", "Serializer", "Decorators"], function (require, exports, Scheme_3, Store_3, Types_1, Serializer_2, Decorators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Scheme = Scheme_3.Scheme;
    exports.ClassDescription = Store_3.ClassDescription;
    exports.PropertyDescription = Store_3.PropertyDescription;
    exports.Store = Store_3.Store;
    exports.array = Types_1.array;
    exports.custom = Types_1.custom;
    exports.date = Types_1.date;
    exports.object = Types_1.object;
    exports.primitive = Types_1.primitive;
    exports.deserialize = Serializer_2.deserialize;
    exports.serialize = Serializer_2.serialize;
    exports.serializable = Decorators_1.serializable;
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9TY2hlbWUudHMiLCJzcmMvU3RvcmUudHMiLCJzcmMvRGVjb3JhdG9ycy50cyIsInNyYy9TZXJpYWxpemVyLnRzIiwic3JjL1R5cGVzLnRzIiwic3JjL2dyYXBoLXNlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFBO1FBQUE7WUFDVyxlQUFVLEdBQW9CLFVBQUMsQ0FBTSxJQUFLLE9BQUEsQ0FBQyxFQUFELENBQUMsQ0FBQztZQUM1QyxpQkFBWSxHQUFvQixVQUFDLENBQU0sSUFBSyxPQUFBLENBQUMsRUFBRCxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUFELGFBQUM7SUFBRCxDQUhBLEFBR0MsSUFBQTtJQUhZLHdCQUFNOzs7OztJQ1FuQjs7T0FFRztJQUNIO1FBTUksNkJBQW1CLFlBQW9CLEVBQUUsUUFBMEM7WUFBMUMseUJBQUEsRUFBQSxhQUEwQztZQUMvRSxJQUFJLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztZQUN6QixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNJLDJDQUFhLEdBQXBCLFVBQXFCLFFBQWdDO1lBQ2pELElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQUMsTUFBTSxLQUFLLFdBQVc7Z0JBQ2hELENBQUMsQ0FBQyxJQUFJLGVBQU0sRUFBRTtnQkFDZCxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sUUFBUSxDQUFDLGNBQWMsS0FBSyxXQUFXO2dCQUNoRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUk7Z0JBQ1gsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUM7WUFDOUIsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNMLDBCQUFDO0lBQUQsQ0ExQkEsQUEwQkMsSUFBQTtJQTFCWSxrREFBbUI7SUFnQ2hDOztPQUVHO0lBQ0g7UUFB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Q0FBSyxJQUFLLE9BQUEsc0JBQVMsQ0FBQyxDQUFDLENBQUMsRUFBWixDQUFZLENBQUM7UUFDNUMsTUFBTSxDQUFDLFlBQVksR0FBRyxVQUFDLENBQUssSUFBSyxPQUFBLHdCQUFXLENBQUMsSUFBSSxFQUFDLENBQUMsQ0FBQyxFQUFuQixDQUFtQixDQUFDO1FBQ3JELE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFMRCx3QkFLQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0JHO0lBQ0gsZ0JBQXVCLFVBQTJCLEVBQUUsWUFBNkI7UUFDN0UsSUFBSSxNQUFNLEdBQUcsSUFBSSxlQUFNLEVBQUUsQ0FBQztRQUMxQixNQUFNLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUMvQixNQUFNLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztRQUNuQyxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBTEQsd0JBS0M7Ozs7O0lDMUdRLDBCQUFBLE1BQU0sQ0FBQTtJQUNOLG1DQUFBLGdCQUFnQixDQUFBO0lBQTRCLHNDQUFBLG1CQUFtQixDQUFBO0lBQStCLHdCQUFBLEtBQUssQ0FBQTtJQUNuRyx3QkFBQSxLQUFLLENBQUE7SUFBRSx5QkFBQSxNQUFNLENBQUE7SUFBRSx1QkFBQSxJQUFJLENBQUE7SUFBRSx5QkFBQSxNQUFNLENBQUE7SUFBRSw0QkFBQSxTQUFTLENBQUE7SUFDdEMsbUNBQUEsV0FBVyxDQUFBO0lBQUUsaUNBQUEsU0FBUyxDQUFBO0lBQ3RCLG9DQUFBLFlBQVksQ0FBQSIsImZpbGUiOiJncmFwaC1zZXJpYWxpemVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIFNjaGVtZSB7XG4gICAgcHVibGljIHNlcmlhbGl6ZXI6ICh2OiBhbnkpID0+IGFueSA9ICh2OiBhbnkpID0+IHY7XG4gICAgcHVibGljIGRlc2VyaWFsaXplcjogKHY6IGFueSkgPT4gYW55ID0gKHY6IGFueSkgPT4gdjtcbn1cbiIsImltcG9ydCB7VFNNYXB9IGZyb20gXCJ0eXBlc2NyaXB0LW1hcFwiO1xuaW1wb3J0IHtTY2hlbWV9IGZyb20gXCIuL1NjaGVtZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb3BlcnR5RGVzY3JpcHRpb25TZXR0aW5ncyB7XG4gICAgc2NoZW1lPzogU2NoZW1lLFxuICAgIHNlcmlhbGl6ZWROYW1lPzogc3RyaW5nXG59XG5cbi8qKlxuICogUHJvcGVydHkgZGVjb3JhdG9yIHN0b3JhZ2UgY2xhc3NcbiAqL1xuZXhwb3J0IGNsYXNzIFByb3BlcnR5RGVzY3JpcHRpb24ge1xuXG4gICAgcHVibGljIHNjaGVtZTogU2NoZW1lO1xuICAgIHB1YmxpYyBuYW1lOiBzdHJpbmc7XG4gICAgcHVibGljIHNlcmlhbGl6ZWROYW1lOiBzdHJpbmc7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IocHJvcGVydHlOYW1lOiBzdHJpbmcsIHNldHRpbmdzOiBQcm9wZXJ0eURlc2NyaXB0aW9uU2V0dGluZ3MgPSB7fSkge1xuICAgICAgICB0aGlzLm5hbWUgPSBwcm9wZXJ0eU5hbWU7XG4gICAgICAgIHRoaXMuc2V0RGVjb3JhdGlvbihzZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIG5ldyBwcm9wZXJ0eSBkZWNvcmF0b3Igc2V0dGluZ3MgaGVyZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7e1twOiBzdHJpbmddOiBhbnl9fSBzZXR0aW5nc1xuICAgICAqIEByZXR1cm5zIHtQcm9wZXJ0eURlc2NyaXB0aW9ufVxuICAgICAqL1xuICAgIHB1YmxpYyBzZXREZWNvcmF0aW9uKHNldHRpbmdzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9KTogUHJvcGVydHlEZXNjcmlwdGlvbiB7XG4gICAgICAgIHRoaXMuc2NoZW1lID0gdHlwZW9mIHNldHRpbmdzLnNjaGVtZSA9PT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgID8gbmV3IFNjaGVtZSgpXG4gICAgICAgICAgICA6IHNldHRpbmdzLnNjaGVtZTtcbiAgICAgICAgdGhpcy5zZXJpYWxpemVkTmFtZSA9IHR5cGVvZiBzZXR0aW5ncy5zZXJpYWxpemVkTmFtZSA9PT0gJ3VuZGVmaW5lZCdcbiAgICAgICAgICAgID8gdGhpcy5uYW1lXG4gICAgICAgICAgICA6IHNldHRpbmdzLnNlcmlhbGl6ZWROYW1lO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2xhc3NEZXNjcmlwdGlvblNldHRpbmdzIHtcbiAgICBwb3N0RGVzZXJpYWxpemU/OiBGdW5jdGlvblxufVxuXG4vKipcbiAqIENsYXNzIGRlY29yYXRvciBzdG9yYWdlXG4gKi9cbmV4cG9ydCBjbGFzcyBDbGFzc0Rlc2NyaXB0aW9uIHtcblxuICAgIHB1YmxpYyBwb3N0RGVzZXJpYWxpemU6IEZ1bmN0aW9uID0gKCkgPT4ge1xuICAgIH07XG4gICAgcHVibGljIHByb3BlcnRpZXM6IFRTTWFwPHN0cmluZywgUHJvcGVydHlEZXNjcmlwdGlvbj4gPSBuZXcgVFNNYXAoKTtcblxuICAgIHB1YmxpYyBzZXREZWNvcmF0aW9uKHNldHRpbmdzOiBDbGFzc0Rlc2NyaXB0aW9uU2V0dGluZ3MpOiBDbGFzc0Rlc2NyaXB0aW9uIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXR0aW5ncyA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgdGhpcy5wb3N0RGVzZXJpYWxpemUgPSB0eXBlb2Ygc2V0dGluZ3MucG9zdERlc2VyaWFsaXplID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyAoKSA9PiB7IH1cbiAgICAgICAgICAgIDogc2V0dGluZ3MucG9zdERlc2VyaWFsaXplO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG5cbi8qKlxuICogTWFpbiBkZWNvcmF0b3Igc3RvcmFnZS4gVGhpcyBjbGFzcyB3aWxsIHN0b3JlIGFuZCBwcm92aWRlIGFjY2VzcyB0byBhbGwgZGVjb3JhdG9ycy5cbiAqL1xuZXhwb3J0IGNsYXNzIFN0b3JlIGV4dGVuZHMgVFNNYXA8YW55LCBDbGFzc0Rlc2NyaXB0aW9uPiB7XG5cbiAgICAvKipcbiAgICAgKiBPdmVycmlkZSBNYXAgZ2V0dGVyLiBXaGVuIG5vIGNsYXNzIGRlc2NyaXB0aW9uIGlzIGZvdW5kLCB3ZSB3YW50IHRvIGluc3RhbnRpYXRlIGFuZCByZXR1cm4gb25lLiBDbGFzcyBkZWNvcmF0b3JzXG4gICAgICogYXJlIG9wdGlvbmFsLCBhbmQgdGhpcyBlbnN1cmVzIHdlIHdpbGwgZ2V0IGEgZGVmYXVsdCBvbmUgd2hlbiByZXF1ZXN0ZWRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBrZXlcbiAgICAgKiBAcmV0dXJucyB7Q2xhc3NEZXNjcmlwdGlvbn1cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0KGtleTogYW55KTogQ2xhc3NEZXNjcmlwdGlvbiB7XG4gICAgICAgIGlmICghdGhpcy5oYXMoa2V5KSkgdGhpcy5zZXQoa2V5LCBuZXcgQ2xhc3NEZXNjcmlwdGlvbigpKTtcbiAgICAgICAgcmV0dXJuIHN1cGVyLmdldChrZXkpO1xuICAgIH1cblxufVxuXG5leHBvcnQgbGV0IHN0b3JlID0gbmV3IFN0b3JlKCk7XG5cbiIsImltcG9ydCB7UHJvcGVydHlEZXNjcmlwdGlvbiwgc3RvcmV9IGZyb20gXCIuL1N0b3JlXCI7XHJcblxyXG4vKipcclxuICogU2VyaWFsaXphYmxlIGRlY29yYXRvci4gVGhlIGRlY29yYXRvciBtYXkgcmVjZWl2ZSBhbiBvYmplY3Qgd2l0aCBzZXR0aW5ncy4gRXhhbXBsZSB1c2FnZTpcclxuICpcclxuICogYGBgXHJcbiAqIEBzZXJpYWxpemFibGUoe1xyXG4gKiAgICAgIHBvc3REZXNlcmlhbGl6ZTogZnVuY3Rpb24ob2JqKXsgWy4uLl0gfVxyXG4gKiB9KVxyXG4gKiBjbGFzcyBFeGFtcGxlQ2xhc3Mge1xyXG4gKiAgQHNlcmlhbGl6YWJsZSgpXHJcbiAqICBwdWJsaWMgbmFtZTogc3RyaW5nO1xyXG4gKlxyXG4gKiAgQHNlcmlhbGl6YWJsZSh7XHJcbiAqICAgICAgc2VyaWFsaXplZE5hbWU6IHRhZ3NcclxuICogICAgICBzY2hlbWU6IGFycmF5KClcclxuICogIH0pXHJcbiAqICBwdWJsaWMgdGFnQXJyOiBzdHJpbmdbXTtcclxuICogfVxyXG4gKiBgYGBcclxuICpcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemFibGUoc2V0dGluZ3M6IG9iamVjdCA9IHt9KTogYW55IHtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24odHlwZTphbnksIHByb3BlcnR5TmFtZTogc3RyaW5nKXtcclxuXHJcbiAgICAgICAgLy8gQ2xhc3MgZGVjb3JhdG9yXHJcbiAgICAgICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICBzdG9yZS5nZXQodHlwZSkuc2V0RGVjb3JhdGlvbihzZXR0aW5ncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQcm9wZXJ0eSBkZWNvcmF0b3JcclxuICAgICAgICBlbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcclxuICAgICAgICAgICAgc3RvcmUuZ2V0KHR5cGUuY29uc3RydWN0b3IpLnByb3BlcnRpZXMuc2V0KHByb3BlcnR5TmFtZSwgbmV3IFByb3BlcnR5RGVzY3JpcHRpb24ocHJvcGVydHlOYW1lLCBzZXR0aW5ncykpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZGVjb3JhdG9yXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59XHJcblxyXG4iLCJpbXBvcnQge1Byb3BlcnR5RGVzY3JpcHRpb24sIHN0b3JlfSBmcm9tIFwiLi9TdG9yZVwiO1xuXG4vKipcbiAqIFNlcmlhbGl6ZXIuIENvbnZlcnRzIGEgSlNPTiBzZXJpYWxpemFibGUgdHJlZSB0byBhbiBvYmplY3QgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIHR5cGVcbiAqIEBwYXJhbSBzcmNcbiAqIEByZXR1cm5zIHthbnl9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXNlcmlhbGl6ZSh0eXBlOiBhbnksIHNyYzogYW55KTogYW55IHtcblxuICAgIGxldCByZXQgPSBuZXcgdHlwZSgpO1xuXG4gICAgbGV0IGlzRGVyaXZlZENsYXNzID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUpIGluc3RhbmNlb2YgRnVuY3Rpb247XG4gICAgaWYoaXNEZXJpdmVkQ2xhc3MpIHtcbiAgICAgICAgbGV0IGV4dGVuZGVkVHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QuZ2V0UHJvdG90eXBlT2YobmV3IHR5cGUoKSkpLmNvbnN0cnVjdG9yO1xuICAgICAgICBPYmplY3QuYXNzaWduKHJldCxkZXNlcmlhbGl6ZShleHRlbmRlZFR5cGUsc3JjKSk7XG4gICAgfVxuXG4gICAgc3RvcmUuZ2V0KHR5cGUpLnByb3BlcnRpZXMuZm9yRWFjaCgocHJvcGVydHk6IFByb3BlcnR5RGVzY3JpcHRpb24sIHByb3BlcnR5TmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldFtwcm9wZXJ0eU5hbWVdID0gcHJvcGVydHkuc2NoZW1lLmRlc2VyaWFsaXplcihzcmNbcHJvcGVydHkuc2VyaWFsaXplZE5hbWVdKTtcbiAgICB9KTtcblxuICAgIHN0b3JlLmdldCh0eXBlKS5wb3N0RGVzZXJpYWxpemUocmV0KTtcblxuICAgIHJldHVybiByZXQ7XG59XG5cbi8qKlxuICogRGVzZXJpYWxpemVyIGZ1bmN0aW9uLiBDb252ZXJ0cyBhbiBvYmplY3QgdG8gYSBKU09OIHNlcmlhbGl6YWJsZSBncmFwaC5cbiAqXG4gKiBAcGFyYW0gc3JjXG4gKiBAcmV0dXJucyB7e1twOiBzdHJpbmddOiBhbnl9fVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplKHNyYzogYW55KTogeyBba2V5OiBzdHJpbmddOiBhbnkgfSB7XG4gICAgbGV0IHJldDogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHt9O1xuXG4gICAgLy9wYXJlbnRcbiAgICBpZihPYmplY3QuZ2V0UHJvdG90eXBlT2YoT2JqZWN0LmdldFByb3RvdHlwZU9mKHNyYykpLmNvbnN0cnVjdG9yICE9PSBPYmplY3QpIHtcbiAgICAgICAgbGV0IHN1cGVyQ2xhc3MgPSBuZXcgKE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc3JjKSkuY29uc3RydWN0b3IpKCk7XG4gICAgICAgIE9iamVjdC5hc3NpZ24ocmV0LHNlcmlhbGl6ZShzdXBlckNsYXNzKSk7XG4gICAgfVxuXG4gICAgc3RvcmUuZ2V0KHNyYy5jb25zdHJ1Y3RvcikucHJvcGVydGllcy5mb3JFYWNoKChwcm9wZXJ0eTpQcm9wZXJ0eURlc2NyaXB0aW9uLHByb3BlcnR5TmFtZTpzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0W3Byb3BlcnR5LnNlcmlhbGl6ZWROYW1lXSA9IHByb3BlcnR5LnNjaGVtZS5zZXJpYWxpemVyKHNyY1twcm9wZXJ0eU5hbWVdKTtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXQ7XG59XG5cbiIsImltcG9ydCB7U2NoZW1lfSBmcm9tIFwiLi9TY2hlbWVcIjtcclxuaW1wb3J0IHtkZXNlcmlhbGl6ZSwgc2VyaWFsaXplfSBmcm9tIFwiLi9TZXJpYWxpemVyXCI7XHJcblxyXG4vKipcclxuICogUHJpbWl0aXZlLCB0aGUgZGVmYXVsdCBzY2hlbWUuIFRoaXMgd2lsbCByZXR1cm4gcHJvcGVydGllcyBhcy1pcyBvbiBkZXNlcmlhbGl6ZS4gVGhpcyBpcyBleHBvcnRlZCBhcyBjb25zdCBiZWNhdXNlXHJcbiAqIHRoZSBwcmltaXRpdmUgc2NoZW1lIHNob3VsZCBuZXZlciBjaGFuZ2UuXHJcbiAqIEB0eXBlIHtTY2hlbWV9XHJcbiAqL1xyXG5leHBvcnQgY29uc3QgcHJpbWl0aXZlID0gbmV3IFNjaGVtZSgpO1xyXG5cclxuLyoqXHJcbiAqIERhdGUgc2NoZW1lLiBUaGlzIHNjaGVtZSB3aWxsIHByb3Blcmx5IHNlcmlhbGl6ZSBhbmQgZGVzZXJpYWxpemUgamF2YXNjcmlwdCBEYXRlIG9iamVjdHMuXHJcbiAqXHJcbiAqIEV4YW1wbGUgdXNhZ2U6XHJcbiAqIGBgYFxyXG4gKiBjbGFzcyBUZXN0Q2xhc3Mge1xyXG4gKiAgQHNlcmlhbGl6YWJsZShkYXRlKVxyXG4gKiAgcHVibGljIGNoaWxkcmVuOiBEYXRlO1xyXG4gKiB9XHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBAdHlwZSB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGRhdGUgPSAoZnVuY3Rpb24oKXtcclxuICAgIGxldCBzY2hlbWUgPSBuZXcgU2NoZW1lKCk7XHJcbiAgICBzY2hlbWUuc2VyaWFsaXplciA9ICh2OkRhdGUpID0+ICh2IGluc3RhbmNlb2YgRGF0ZSkgPyB2LnRvSlNPTigpIDogdjtcclxuICAgIHNjaGVtZS5kZXNlcmlhbGl6ZXIgPSAodjpzdHJpbmcpID0+ICh0eXBlb2YgdiA9PT0gJ3N0cmluZycpID8gbmV3IERhdGUodikgOiB2O1xyXG4gICAgcmV0dXJuIHNjaGVtZTtcclxufSkoKTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgYXJyYXkgZnVuY3Rpb24gd2lsbCBhcHBseSBhIHNjaGVtZSB0byBhbGwgb2YgaXRzIGNoaWxkcmVuLlxyXG4gKlxyXG4gKiBFeGFtcGxlIHVzYWdlOlxyXG4gKiBgYGBcclxuICogY2xhc3MgVGVzdENsYXNzIHtcclxuICogIEBzZXJpYWxpemFibGUoYXJyYXkoKSlcclxuICogIHB1YmxpYyBjaGlsZHJlbjogc3RyaW5nW107XHJcbiAqIH1cclxuICogYGBgXHJcbiAqXHJcbiAqIEBwYXJhbSB7U2NoZW1lfSBjaGlsZFNjaGVtZVxyXG4gKiBAcmV0dXJucyB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KGNoaWxkU2NoZW1lOiBTY2hlbWUgPSBwcmltaXRpdmUpIHtcclxuICAgIGxldCBzY2hlbWUgPSBuZXcgU2NoZW1lKCk7XHJcbiAgICBzY2hlbWUuc2VyaWFsaXplciA9ICh2OiBhbnkpID0+IHtcclxuICAgICAgICByZXR1cm4gdi5tYXAoKHc6IGFueSkgPT4gY2hpbGRTY2hlbWUuc2VyaWFsaXplcih3KSlcclxuICAgIH07XHJcbiAgICBzY2hlbWUuZGVzZXJpYWxpemVyID0gKHY6IGFueSkgPT4ge1xyXG4gICAgICAgIGlmKHYgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHY7XHJcbiAgICAgICAgcmV0dXJuIHYubWFwKCh3OiBhbnkpID0+IGNoaWxkU2NoZW1lLmRlc2VyaWFsaXplcih3KSlcclxuICAgIH07XHJcbiAgICByZXR1cm4gc2NoZW1lO1xyXG59XHJcblxyXG4vKipcclxuICogVGhlIG9iamVjdCBmdW5jdGlvbiB3aWxsIHNlcmlhbGl6ZSBhIG5lc3RlZCBvYmplY3RcclxuICpcclxuICogRXhhbXBsZSB1c2FnZTpcclxuICogYGBgXHJcbiAqIGNsYXNzIEEgeyBuYW1lOiBzdHJpbmcgfVxyXG4gKiBjbGFzcyBCIHtcclxuICogICBAc2VyaWFsaXphYmxlKG9iamVjdChBKSlcclxuICogICBwdWJsaWMgbmVzdGVkT2JqZWN0OiBBO1xyXG4gKiB9XHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBAcGFyYW0gdHlwZVxyXG4gKiBAcmV0dXJucyB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIG9iamVjdCh0eXBlOiBhbnkpOiBTY2hlbWUge1xyXG4gICAgbGV0IHNjaGVtZSA9IG5ldyBTY2hlbWUoKTtcclxuICAgIHNjaGVtZS5zZXJpYWxpemVyID0gKHY6YW55KSA9PiBzZXJpYWxpemUodik7XHJcbiAgICBzY2hlbWUuZGVzZXJpYWxpemVyID0gKHY6YW55KSA9PiBkZXNlcmlhbGl6ZSh0eXBlLHYpO1xyXG4gICAgcmV0dXJuIHNjaGVtZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRoZSBjdXN0b20gZnVuY3Rpb24gYWxsb3dzIHlvdSB0byBjcmVhdGUgeW91ciBvd24gc2VyaWFsaXplciBmdW5jdGlvbmFsaXR5LiBVc2VkIGluIHBvbHltb3JwaCB0eXBlcyBhbmQgYXJyYXlzLlxyXG4gKlxyXG4gKiBFeGFtcGxlIHVzYWdlOlxyXG4gKiBgYGBcclxuICogY2xhc3MgQSB7IHB1YmxpYyB0eXBlID0gJ2EnOyB9XHJcbiAqIGNsYXNzIEIgeyBwdWJsaWMgdHlwZSA9ICdiJzsgfVxyXG4gKiBjbGFzcyBUZXN0Q2xhc3Mge1xyXG4gKiAgQHNlcmlhbGl6YWJsZShjdXN0b20oXHJcbiAqICAgICAgKHY6YW55KT0+dixcclxuICogICAgICAodjphbnkpID0+IGRlc2VyaWFsaXplKHtcclxuICogICAgICAgICAgJ2EnOkEsXHJcbiAqICAgICAgICAgICdiJzpCXHJcbiAqICAgICAgfVt2LnR5cGVdLHYpXHJcbiAqICApKVxyXG4gKiAgcHVibGljIHRlc3Q6IEF8QjtcclxuICogfVxyXG4gKiBgYGBcclxuICpcclxuICogQHBhcmFtIHsodjogYW55KSA9PiBhbnl9IHNlcmlhbGl6ZXJcclxuICogQHBhcmFtIHsodjogYW55KSA9PiBhbnl9IGRlc2VyaWFsaXplclxyXG4gKiBAcmV0dXJucyB7U2NoZW1lfVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGN1c3RvbShzZXJpYWxpemVyOiAodjogYW55KSA9PiBhbnksIGRlc2VyaWFsaXplcjogKHY6IGFueSkgPT4gYW55KTogU2NoZW1lIHtcclxuICAgIGxldCBzY2hlbWUgPSBuZXcgU2NoZW1lKCk7XHJcbiAgICBzY2hlbWUuc2VyaWFsaXplciA9IHNlcmlhbGl6ZXI7XHJcbiAgICBzY2hlbWUuZGVzZXJpYWxpemVyID0gZGVzZXJpYWxpemVyO1xyXG4gICAgcmV0dXJuIHNjaGVtZTtcclxufVxyXG5cclxuIiwiZXhwb3J0IHsgU2NoZW1lIH0gZnJvbSBcIi4vU2NoZW1lXCI7XG5leHBvcnQgeyBDbGFzc0Rlc2NyaXB0aW9uLCBDbGFzc0Rlc2NyaXB0aW9uU2V0dGluZ3MsIFByb3BlcnR5RGVzY3JpcHRpb24sIFByb3BlcnR5RGVzY3JpcHRpb25TZXR0aW5ncywgU3RvcmUgfSBmcm9tIFwiLi9TdG9yZVwiO1xuZXhwb3J0IHsgYXJyYXksIGN1c3RvbSwgZGF0ZSwgb2JqZWN0LCBwcmltaXRpdmV9IGZyb20gXCIuL1R5cGVzXCI7XG5leHBvcnQgeyBkZXNlcmlhbGl6ZSwgc2VyaWFsaXplIH0gZnJvbSBcIi4vU2VyaWFsaXplclwiO1xuZXhwb3J0IHsgc2VyaWFsaXphYmxlIH0gZnJvbSBcIi4vRGVjb3JhdG9yc1wiO1xuXG4iXX0=
