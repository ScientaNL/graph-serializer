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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9TY2hlbWUudHMiLCJzcmMvU3RvcmUudHMiLCJzcmMvRGVjb3JhdG9ycy50cyIsInNyYy9TZXJpYWxpemVyLnRzIiwic3JjL1R5cGVzLnRzIiwic3JjL2dyYXBoLXNlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQUFBO1FBQUE7WUFDVyxlQUFVLEdBQW9CLFVBQUMsQ0FBTSxJQUFLLE9BQUEsQ0FBQyxFQUFELENBQUMsQ0FBQztZQUM1QyxpQkFBWSxHQUFvQixVQUFDLENBQU0sSUFBSyxPQUFBLENBQUMsRUFBRCxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUFELGFBQUM7SUFBRCxDQUhBLEFBR0MsSUFBQTtJQUhZLHdCQUFNOzs7OztJQ1FuQjs7T0FFRztJQUNIO1FBTUksNkJBQW1CLFlBQW9CLEVBQUUsUUFBMEM7WUFBMUMseUJBQUEsRUFBQSxhQUEwQztZQUMvRSxJQUFJLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztZQUN6QixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRDs7Ozs7V0FLRztRQUNJLDJDQUFhLEdBQXBCLFVBQXFCLFFBQWdDO1lBQ2pELElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxRQUFRLENBQUMsTUFBTSxLQUFLLFdBQVc7Z0JBQ2hELENBQUMsQ0FBQyxJQUFJLGVBQU0sRUFBRTtnQkFDZCxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztZQUN0QixJQUFJLENBQUMsY0FBYyxHQUFHLE9BQU8sUUFBUSxDQUFDLGNBQWMsS0FBSyxXQUFXO2dCQUNoRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUk7Z0JBQ1gsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUM7WUFDOUIsT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztRQUNMLDBCQUFDO0lBQUQsQ0ExQkEsQUEwQkMsSUFBQTtJQTFCWSxrREFBbUI7SUFnQ2hDOztPQUVHO0lBQ0g7UUFB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QyxDQUFLLElBQUssT0FBQSxzQkFBUyxDQUFDLENBQUMsQ0FBQyxFQUFaLENBQVksQ0FBQztRQUM1QyxNQUFNLENBQUMsWUFBWSxHQUFHLFVBQUMsQ0FBSyxJQUFLLE9BQUEsd0JBQVcsQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUFDLEVBQW5CLENBQW1CLENBQUM7UUFDckQsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUxELHdCQUtDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FzQkc7SUFDSCxnQkFBdUIsVUFBMkIsRUFBRSxZQUE2QjtRQUM3RSxJQUFJLE1BQU0sR0FBRyxJQUFJLGVBQU0sRUFBRSxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1FBQy9CLE1BQU0sQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ25DLE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFMRCx3QkFLQzs7Ozs7SUMxR1EsMEJBQUEsTUFBTSxDQUFBO0lBQ04sbUNBQUEsZ0JBQWdCLENBQUE7SUFBNEIsc0NBQUEsbUJBQW1CLENBQUE7SUFBK0Isd0JBQUEsS0FBSyxDQUFBO0lBQ25HLHdCQUFBLEtBQUssQ0FBQTtJQUFFLHlCQUFBLE1BQU0sQ0FBQTtJQUFFLHVCQUFBLElBQUksQ0FBQTtJQUFFLHlCQUFBLE1BQU0sQ0FBQTtJQUFFLDRCQUFBLFNBQVMsQ0FBQTtJQUN0QyxtQ0FBQSxXQUFXLENBQUE7SUFBRSxpQ0FBQSxTQUFTLENBQUE7SUFDdEIsb0NBQUEsWUFBWSxDQUFBIiwiZmlsZSI6ImdyYXBoLXNlcmlhbGl6ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgU2NoZW1lIHtcbiAgICBwdWJsaWMgc2VyaWFsaXplcjogKHY6IGFueSkgPT4gYW55ID0gKHY6IGFueSkgPT4gdjtcbiAgICBwdWJsaWMgZGVzZXJpYWxpemVyOiAodjogYW55KSA9PiBhbnkgPSAodjogYW55KSA9PiB2O1xufVxuIiwiaW1wb3J0IHtUU01hcH0gZnJvbSBcInR5cGVzY3JpcHQtbWFwXCI7XG5pbXBvcnQge1NjaGVtZX0gZnJvbSBcIi4vU2NoZW1lXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvcGVydHlEZXNjcmlwdGlvblNldHRpbmdzIHtcbiAgICBzY2hlbWU/OiBTY2hlbWUsXG4gICAgc2VyaWFsaXplZE5hbWU/OiBzdHJpbmdcbn1cblxuLyoqXG4gKiBQcm9wZXJ0eSBkZWNvcmF0b3Igc3RvcmFnZSBjbGFzc1xuICovXG5leHBvcnQgY2xhc3MgUHJvcGVydHlEZXNjcmlwdGlvbiB7XG5cbiAgICBwdWJsaWMgc2NoZW1lOiBTY2hlbWU7XG4gICAgcHVibGljIG5hbWU6IHN0cmluZztcbiAgICBwdWJsaWMgc2VyaWFsaXplZE5hbWU6IHN0cmluZztcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcm9wZXJ0eU5hbWU6IHN0cmluZywgc2V0dGluZ3M6IFByb3BlcnR5RGVzY3JpcHRpb25TZXR0aW5ncyA9IHt9KSB7XG4gICAgICAgIHRoaXMubmFtZSA9IHByb3BlcnR5TmFtZTtcbiAgICAgICAgdGhpcy5zZXREZWNvcmF0aW9uKHNldHRpbmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgbmV3IHByb3BlcnR5IGRlY29yYXRvciBzZXR0aW5ncyBoZXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHt7W3A6IHN0cmluZ106IGFueX19IHNldHRpbmdzXG4gICAgICogQHJldHVybnMge1Byb3BlcnR5RGVzY3JpcHRpb259XG4gICAgICovXG4gICAgcHVibGljIHNldERlY29yYXRpb24oc2V0dGluZ3M6IHsgW2tleTogc3RyaW5nXTogYW55IH0pOiBQcm9wZXJ0eURlc2NyaXB0aW9uIHtcbiAgICAgICAgdGhpcy5zY2hlbWUgPSB0eXBlb2Ygc2V0dGluZ3Muc2NoZW1lID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyBuZXcgU2NoZW1lKClcbiAgICAgICAgICAgIDogc2V0dGluZ3Muc2NoZW1lO1xuICAgICAgICB0aGlzLnNlcmlhbGl6ZWROYW1lID0gdHlwZW9mIHNldHRpbmdzLnNlcmlhbGl6ZWROYW1lID09PSAndW5kZWZpbmVkJ1xuICAgICAgICAgICAgPyB0aGlzLm5hbWVcbiAgICAgICAgICAgIDogc2V0dGluZ3Muc2VyaWFsaXplZE5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBDbGFzc0Rlc2NyaXB0aW9uU2V0dGluZ3Mge1xuICAgIHBvc3REZXNlcmlhbGl6ZT86IEZ1bmN0aW9uXG59XG5cbi8qKlxuICogQ2xhc3MgZGVjb3JhdG9yIHN0b3JhZ2VcbiAqL1xuZXhwb3J0IGNsYXNzIENsYXNzRGVzY3JpcHRpb24ge1xuXG4gICAgcHVibGljIHBvc3REZXNlcmlhbGl6ZTogRnVuY3Rpb24gPSAoKSA9PiB7XG4gICAgfTtcbiAgICBwdWJsaWMgcHJvcGVydGllczogVFNNYXA8c3RyaW5nLCBQcm9wZXJ0eURlc2NyaXB0aW9uPiA9IG5ldyBUU01hcCgpO1xuXG4gICAgcHVibGljIHNldERlY29yYXRpb24oc2V0dGluZ3M6IENsYXNzRGVzY3JpcHRpb25TZXR0aW5ncyk6IENsYXNzRGVzY3JpcHRpb24ge1xuICAgICAgICBpZiAodHlwZW9mIHNldHRpbmdzID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB0aGlzLnBvc3REZXNlcmlhbGl6ZSA9IHR5cGVvZiBzZXR0aW5ncy5wb3N0RGVzZXJpYWxpemUgPT09ICd1bmRlZmluZWQnXG4gICAgICAgICAgICA/ICgpID0+IHsgfVxuICAgICAgICAgICAgOiBzZXR0aW5ncy5wb3N0RGVzZXJpYWxpemU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxuLyoqXG4gKiBNYWluIGRlY29yYXRvciBzdG9yYWdlLiBUaGlzIGNsYXNzIHdpbGwgc3RvcmUgYW5kIHByb3ZpZGUgYWNjZXNzIHRvIGFsbCBkZWNvcmF0b3JzLlxuICovXG5leHBvcnQgY2xhc3MgU3RvcmUgZXh0ZW5kcyBUU01hcDxhbnksIENsYXNzRGVzY3JpcHRpb24+IHtcblxuICAgIC8qKlxuICAgICAqIE92ZXJyaWRlIE1hcCBnZXR0ZXIuIFdoZW4gbm8gY2xhc3MgZGVzY3JpcHRpb24gaXMgZm91bmQsIHdlIHdhbnQgdG8gaW5zdGFudGlhdGUgYW5kIHJldHVybiBvbmUuIENsYXNzIGRlY29yYXRvcnNcbiAgICAgKiBhcmUgb3B0aW9uYWwsIGFuZCB0aGlzIGVuc3VyZXMgd2Ugd2lsbCBnZXQgYSBkZWZhdWx0IG9uZSB3aGVuIHJlcXVlc3RlZFxuICAgICAqXG4gICAgICogQHBhcmFtIGtleVxuICAgICAqIEByZXR1cm5zIHtDbGFzc0Rlc2NyaXB0aW9ufVxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQoa2V5OiBhbnkpOiBDbGFzc0Rlc2NyaXB0aW9uIHtcbiAgICAgICAgaWYgKCF0aGlzLmhhcyhrZXkpKSB0aGlzLnNldChrZXksIG5ldyBDbGFzc0Rlc2NyaXB0aW9uKCkpO1xuICAgICAgICByZXR1cm4gc3VwZXIuZ2V0KGtleSk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBsZXQgc3RvcmUgPSBuZXcgU3RvcmUoKTtcblxuIiwiaW1wb3J0IHtDbGFzc0Rlc2NyaXB0aW9uU2V0dGluZ3MsIFByb3BlcnR5RGVzY3JpcHRpb24sIFByb3BlcnR5RGVzY3JpcHRpb25TZXR0aW5ncywgc3RvcmV9IGZyb20gXCIuL1N0b3JlXCI7XHJcblxyXG4vKipcclxuICogU2VyaWFsaXphYmxlIGRlY29yYXRvci4gVGhlIGRlY29yYXRvciBtYXkgcmVjZWl2ZSBhbiBvYmplY3Qgd2l0aCBzZXR0aW5ncy4gRXhhbXBsZSB1c2FnZTpcclxuICpcclxuICogYGBgXHJcbiAqIEBzZXJpYWxpemFibGUoe1xyXG4gKiAgICAgIHBvc3REZXNlcmlhbGl6ZTogZnVuY3Rpb24ob2JqKXsgWy4uLl0gfVxyXG4gKiB9KVxyXG4gKiBjbGFzcyBFeGFtcGxlQ2xhc3Mge1xyXG4gKiAgQHNlcmlhbGl6YWJsZSgpXHJcbiAqICBwdWJsaWMgbmFtZTogc3RyaW5nO1xyXG4gKlxyXG4gKiAgQHNlcmlhbGl6YWJsZSh7XHJcbiAqICAgICAgc2VyaWFsaXplZE5hbWU6IHRhZ3NcclxuICogICAgICBzY2hlbWU6IGFycmF5KClcclxuICogIH0pXHJcbiAqICBwdWJsaWMgdGFnQXJyOiBzdHJpbmdbXTtcclxuICogfVxyXG4gKiBgYGBcclxuICpcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemFibGUoc2V0dGluZ3M6IENsYXNzRGVzY3JpcHRpb25TZXR0aW5nc3xQcm9wZXJ0eURlc2NyaXB0aW9uU2V0dGluZ3MgPSB7fSk6IGFueSB7XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHR5cGU6YW55LCBwcm9wZXJ0eU5hbWU6IHN0cmluZyl7XHJcblxyXG4gICAgICAgIC8vIENsYXNzIGRlY29yYXRvclxyXG4gICAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgc3RvcmUuZ2V0KHR5cGUpLnNldERlY29yYXRpb24oPENsYXNzRGVzY3JpcHRpb25TZXR0aW5ncz5zZXR0aW5ncyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQcm9wZXJ0eSBkZWNvcmF0b3JcclxuICAgICAgICBlbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcclxuICAgICAgICAgICAgc3RvcmUuZ2V0KHR5cGUuY29uc3RydWN0b3IpLnByb3BlcnRpZXMuc2V0KHByb3BlcnR5TmFtZSwgbmV3IFByb3BlcnR5RGVzY3JpcHRpb24ocHJvcGVydHlOYW1lLCA8UHJvcGVydHlEZXNjcmlwdGlvblNldHRpbmdzPnNldHRpbmdzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBkZWNvcmF0b3JcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn1cclxuXHJcbiIsImltcG9ydCB7UHJvcGVydHlEZXNjcmlwdGlvbiwgc3RvcmV9IGZyb20gXCIuL1N0b3JlXCI7XG5cbi8qKlxuICogU2VyaWFsaXplci4gQ29udmVydHMgYSBKU09OIHNlcmlhbGl6YWJsZSB0cmVlIHRvIGFuIG9iamVjdCBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gdHlwZVxuICogQHBhcmFtIHNyY1xuICogQHJldHVybnMge2FueX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc2VyaWFsaXplKHR5cGU6IGFueSwgc3JjOiBhbnkpOiBhbnkge1xuXG4gICAgbGV0IHJldCA9IG5ldyB0eXBlKCk7XG5cbiAgICBsZXQgaXNEZXJpdmVkQ2xhc3MgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZSkgaW5zdGFuY2VvZiBGdW5jdGlvbjtcbiAgICBpZihpc0Rlcml2ZWRDbGFzcykge1xuICAgICAgICBsZXQgZXh0ZW5kZWRUeXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5nZXRQcm90b3R5cGVPZihuZXcgdHlwZSgpKSkuY29uc3RydWN0b3I7XG4gICAgICAgIE9iamVjdC5hc3NpZ24ocmV0LGRlc2VyaWFsaXplKGV4dGVuZGVkVHlwZSxzcmMpKTtcbiAgICB9XG5cbiAgICBzdG9yZS5nZXQodHlwZSkucHJvcGVydGllcy5mb3JFYWNoKChwcm9wZXJ0eTogUHJvcGVydHlEZXNjcmlwdGlvbiwgcHJvcGVydHlOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0W3Byb3BlcnR5TmFtZV0gPSBwcm9wZXJ0eS5zY2hlbWUuZGVzZXJpYWxpemVyKHNyY1twcm9wZXJ0eS5zZXJpYWxpemVkTmFtZV0pO1xuICAgIH0pO1xuXG4gICAgc3RvcmUuZ2V0KHR5cGUpLnBvc3REZXNlcmlhbGl6ZShyZXQpO1xuXG4gICAgcmV0dXJuIHJldDtcbn1cblxuLyoqXG4gKiBEZXNlcmlhbGl6ZXIgZnVuY3Rpb24uIENvbnZlcnRzIGFuIG9iamVjdCB0byBhIEpTT04gc2VyaWFsaXphYmxlIGdyYXBoLlxuICpcbiAqIEBwYXJhbSBzcmNcbiAqIEByZXR1cm5zIHt7W3A6IHN0cmluZ106IGFueX19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemUoc3JjOiBhbnkpOiB7IFtrZXk6IHN0cmluZ106IGFueSB9IHtcbiAgICBsZXQgcmV0OiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge307XG5cbiAgICAvL3BhcmVudFxuICAgIGlmKE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc3JjKSkuY29uc3RydWN0b3IgIT09IE9iamVjdCkge1xuICAgICAgICBsZXQgc3VwZXJDbGFzcyA9IG5ldyAoT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5nZXRQcm90b3R5cGVPZihzcmMpKS5jb25zdHJ1Y3RvcikoKTtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihyZXQsc2VyaWFsaXplKHN1cGVyQ2xhc3MpKTtcbiAgICB9XG5cbiAgICBzdG9yZS5nZXQoc3JjLmNvbnN0cnVjdG9yKS5wcm9wZXJ0aWVzLmZvckVhY2goKHByb3BlcnR5OlByb3BlcnR5RGVzY3JpcHRpb24scHJvcGVydHlOYW1lOnN0cmluZykgPT4ge1xuICAgICAgICByZXRbcHJvcGVydHkuc2VyaWFsaXplZE5hbWVdID0gcHJvcGVydHkuc2NoZW1lLnNlcmlhbGl6ZXIoc3JjW3Byb3BlcnR5TmFtZV0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJldDtcbn1cblxuIiwiaW1wb3J0IHtTY2hlbWV9IGZyb20gXCIuL1NjaGVtZVwiO1xyXG5pbXBvcnQge2Rlc2VyaWFsaXplLCBzZXJpYWxpemV9IGZyb20gXCIuL1NlcmlhbGl6ZXJcIjtcclxuXHJcbi8qKlxyXG4gKiBQcmltaXRpdmUsIHRoZSBkZWZhdWx0IHNjaGVtZS4gVGhpcyB3aWxsIHJldHVybiBwcm9wZXJ0aWVzIGFzLWlzIG9uIGRlc2VyaWFsaXplLiBUaGlzIGlzIGV4cG9ydGVkIGFzIGNvbnN0IGJlY2F1c2VcclxuICogdGhlIHByaW1pdGl2ZSBzY2hlbWUgc2hvdWxkIG5ldmVyIGNoYW5nZS5cclxuICogQHR5cGUge1NjaGVtZX1cclxuICovXHJcbmV4cG9ydCBjb25zdCBwcmltaXRpdmUgPSBuZXcgU2NoZW1lKCk7XHJcblxyXG4vKipcclxuICogRGF0ZSBzY2hlbWUuIFRoaXMgc2NoZW1lIHdpbGwgcHJvcGVybHkgc2VyaWFsaXplIGFuZCBkZXNlcmlhbGl6ZSBqYXZhc2NyaXB0IERhdGUgb2JqZWN0cy5cclxuICpcclxuICogRXhhbXBsZSB1c2FnZTpcclxuICogYGBgXHJcbiAqIGNsYXNzIFRlc3RDbGFzcyB7XHJcbiAqICBAc2VyaWFsaXphYmxlKGRhdGUpXHJcbiAqICBwdWJsaWMgY2hpbGRyZW46IERhdGU7XHJcbiAqIH1cclxuICogYGBgXHJcbiAqXHJcbiAqIEB0eXBlIHtTY2hlbWV9XHJcbiAqL1xyXG5leHBvcnQgY29uc3QgZGF0ZSA9IChmdW5jdGlvbigpe1xyXG4gICAgbGV0IHNjaGVtZSA9IG5ldyBTY2hlbWUoKTtcclxuICAgIHNjaGVtZS5zZXJpYWxpemVyID0gKHY6RGF0ZSkgPT4gKHYgaW5zdGFuY2VvZiBEYXRlKSA/IHYudG9KU09OKCkgOiB2O1xyXG4gICAgc2NoZW1lLmRlc2VyaWFsaXplciA9ICh2OnN0cmluZykgPT4gKHR5cGVvZiB2ID09PSAnc3RyaW5nJykgPyBuZXcgRGF0ZSh2KSA6IHY7XHJcbiAgICByZXR1cm4gc2NoZW1lO1xyXG59KSgpO1xyXG5cclxuLyoqXHJcbiAqIFRoZSBhcnJheSBmdW5jdGlvbiB3aWxsIGFwcGx5IGEgc2NoZW1lIHRvIGFsbCBvZiBpdHMgY2hpbGRyZW4uXHJcbiAqXHJcbiAqIEV4YW1wbGUgdXNhZ2U6XHJcbiAqIGBgYFxyXG4gKiBjbGFzcyBUZXN0Q2xhc3Mge1xyXG4gKiAgQHNlcmlhbGl6YWJsZShhcnJheSgpKVxyXG4gKiAgcHVibGljIGNoaWxkcmVuOiBzdHJpbmdbXTtcclxuICogfVxyXG4gKiBgYGBcclxuICpcclxuICogQHBhcmFtIHtTY2hlbWV9IGNoaWxkU2NoZW1lXHJcbiAqIEByZXR1cm5zIHtTY2hlbWV9XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gYXJyYXkoY2hpbGRTY2hlbWU6IFNjaGVtZSA9IHByaW1pdGl2ZSkge1xyXG4gICAgbGV0IHNjaGVtZSA9IG5ldyBTY2hlbWUoKTtcclxuICAgIHNjaGVtZS5zZXJpYWxpemVyID0gKHY6IGFueSkgPT4ge1xyXG4gICAgICAgIHJldHVybiB2Lm1hcCgodzogYW55KSA9PiBjaGlsZFNjaGVtZS5zZXJpYWxpemVyKHcpKVxyXG4gICAgfTtcclxuICAgIHNjaGVtZS5kZXNlcmlhbGl6ZXIgPSAodjogYW55KSA9PiB7XHJcbiAgICAgICAgaWYodiA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdjtcclxuICAgICAgICByZXR1cm4gdi5tYXAoKHc6IGFueSkgPT4gY2hpbGRTY2hlbWUuZGVzZXJpYWxpemVyKHcpKVxyXG4gICAgfTtcclxuICAgIHJldHVybiBzY2hlbWU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGUgb2JqZWN0IGZ1bmN0aW9uIHdpbGwgc2VyaWFsaXplIGEgbmVzdGVkIG9iamVjdFxyXG4gKlxyXG4gKiBFeGFtcGxlIHVzYWdlOlxyXG4gKiBgYGBcclxuICogY2xhc3MgQSB7IG5hbWU6IHN0cmluZyB9XHJcbiAqIGNsYXNzIEIge1xyXG4gKiAgIEBzZXJpYWxpemFibGUob2JqZWN0KEEpKVxyXG4gKiAgIHB1YmxpYyBuZXN0ZWRPYmplY3Q6IEE7XHJcbiAqIH1cclxuICogYGBgXHJcbiAqXHJcbiAqIEBwYXJhbSB0eXBlXHJcbiAqIEByZXR1cm5zIHtTY2hlbWV9XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gb2JqZWN0KHR5cGU6IGFueSk6IFNjaGVtZSB7XHJcbiAgICBsZXQgc2NoZW1lID0gbmV3IFNjaGVtZSgpO1xyXG4gICAgc2NoZW1lLnNlcmlhbGl6ZXIgPSAodjphbnkpID0+IHNlcmlhbGl6ZSh2KTtcclxuICAgIHNjaGVtZS5kZXNlcmlhbGl6ZXIgPSAodjphbnkpID0+IGRlc2VyaWFsaXplKHR5cGUsdik7XHJcbiAgICByZXR1cm4gc2NoZW1lO1xyXG59XHJcblxyXG4vKipcclxuICogVGhlIGN1c3RvbSBmdW5jdGlvbiBhbGxvd3MgeW91IHRvIGNyZWF0ZSB5b3VyIG93biBzZXJpYWxpemVyIGZ1bmN0aW9uYWxpdHkuIFVzZWQgaW4gcG9seW1vcnBoIHR5cGVzIGFuZCBhcnJheXMuXHJcbiAqXHJcbiAqIEV4YW1wbGUgdXNhZ2U6XHJcbiAqIGBgYFxyXG4gKiBjbGFzcyBBIHsgcHVibGljIHR5cGUgPSAnYSc7IH1cclxuICogY2xhc3MgQiB7IHB1YmxpYyB0eXBlID0gJ2InOyB9XHJcbiAqIGNsYXNzIFRlc3RDbGFzcyB7XHJcbiAqICBAc2VyaWFsaXphYmxlKGN1c3RvbShcclxuICogICAgICAodjphbnkpPT52LFxyXG4gKiAgICAgICh2OmFueSkgPT4gZGVzZXJpYWxpemUoe1xyXG4gKiAgICAgICAgICAnYSc6QSxcclxuICogICAgICAgICAgJ2InOkJcclxuICogICAgICB9W3YudHlwZV0sdilcclxuICogICkpXHJcbiAqICBwdWJsaWMgdGVzdDogQXxCO1xyXG4gKiB9XHJcbiAqIGBgYFxyXG4gKlxyXG4gKiBAcGFyYW0geyh2OiBhbnkpID0+IGFueX0gc2VyaWFsaXplclxyXG4gKiBAcGFyYW0geyh2OiBhbnkpID0+IGFueX0gZGVzZXJpYWxpemVyXHJcbiAqIEByZXR1cm5zIHtTY2hlbWV9XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3VzdG9tKHNlcmlhbGl6ZXI6ICh2OiBhbnkpID0+IGFueSwgZGVzZXJpYWxpemVyOiAodjogYW55KSA9PiBhbnkpOiBTY2hlbWUge1xyXG4gICAgbGV0IHNjaGVtZSA9IG5ldyBTY2hlbWUoKTtcclxuICAgIHNjaGVtZS5zZXJpYWxpemVyID0gc2VyaWFsaXplcjtcclxuICAgIHNjaGVtZS5kZXNlcmlhbGl6ZXIgPSBkZXNlcmlhbGl6ZXI7XHJcbiAgICByZXR1cm4gc2NoZW1lO1xyXG59XHJcblxyXG4iLCJleHBvcnQgeyBTY2hlbWUgfSBmcm9tIFwiLi9TY2hlbWVcIjtcbmV4cG9ydCB7IENsYXNzRGVzY3JpcHRpb24sIENsYXNzRGVzY3JpcHRpb25TZXR0aW5ncywgUHJvcGVydHlEZXNjcmlwdGlvbiwgUHJvcGVydHlEZXNjcmlwdGlvblNldHRpbmdzLCBTdG9yZSB9IGZyb20gXCIuL1N0b3JlXCI7XG5leHBvcnQgeyBhcnJheSwgY3VzdG9tLCBkYXRlLCBvYmplY3QsIHByaW1pdGl2ZX0gZnJvbSBcIi4vVHlwZXNcIjtcbmV4cG9ydCB7IGRlc2VyaWFsaXplLCBzZXJpYWxpemUgfSBmcm9tIFwiLi9TZXJpYWxpemVyXCI7XG5leHBvcnQgeyBzZXJpYWxpemFibGUgfSBmcm9tIFwiLi9EZWNvcmF0b3JzXCI7XG5cbiJdfQ==
