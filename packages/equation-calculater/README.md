# equation-calculater

```ts
import { calculateEquation3, calculateEquation4, calculateEquation5 } from 'equation-calculater'
calculateEquation3(a, b, c, d) // a * x^3 + b x^2 + c x + d = 0
calculateEquation4(a, b, c, d, e) // a * x^4 + b x^3 + c x^2 + d x + e = 0
calculateEquation5([a, b, c, d, e, f], x0) // a * x^5 + b x^4 + c x^3 + d x^2 + e x + f = 0
calculateEquation5([a, b, c, d, e, f, g], x0) // a * x^6 + b x^5 + c x^4 + d x^3 + e x^2 + f x + g = 0
```