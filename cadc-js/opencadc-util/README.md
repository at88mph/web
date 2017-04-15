## OpenCADC Util package  (1.0.2)

Provides some utility objects to perform some repetitive tasks.

### StringUtil

### format()

Similar to Java's `String.format()`, but simplified.  Uses numerical
indexing (starting at 1), and an array of values to replace them with,
in order.

### matches()

Run regex `test()` on a given regex for a given String.

### contains()

If a given String is contained within another.  Optional case check

### endsWith()

If a String ends with another one.

### hasLength() / hasText()

If a given String has any length at all, and contains something
relevant.

