
## Pruebas obligatorias


| # | Prueba | Esperado | Resultado |
|---|---|---|---|
| 1 | Agregar un material 3 veces | Un solo item con cantidad 3 | OK. Queda un solo item con cantidad 3. |
| 2 | Restar hasta cero | El item desaparece del carrito | OK. Al llegar a 0 el item desaparece. |
| 3 | Intentar superar el stock | Aviso y el carrito no cambia | OK. Aparece el aviso y la cantidad no cambia. |
| 4 | Guardar un presupuesto | El mensaje muestra el total de la BASE y el stock del catálogo baja | OK. Muestra el total que devolvió la base, vacía el carrito y aparece en el historial. |
| 5 | Prueba del precio viejo | El total guardado usa el precio NUEVO | OK. El total guardado usó el precio nuevo, no el que mostraba la pantalla. |
| 6 | Items vacíos por curl | 400 con código 50031 | OK. Respondió 400 con "codigo":50031. |
| 7 | Material 999 por curl | 400 con código 50029 y rollback completo | OK. Respondió 400 con "codigo":50029 y no quedó nada guardado. |

### Prueba 5 — el precio viejo

OK. La pantalla mostraba un estimado de $24.000 (2 bolsas a $12.000); cambié el precio a $15.000 en SSMS sin recargar y al guardar la base devolvió $30.000. En el detalle quedó PrecioUnitario = 15000.
### Pruebas 6 y 7 — curl

| 6 | Items vacíos por curl | 400 con código 50031 | OK. Respondió 400 con "codigo":50031 y el mensaje "El presupuesto no tiene items." |
| 7 | Material 999 por curl | 400 con código 50029 y rollback completo | OK. Respondió 400 con "codigo":50029. Rollback verificado: presupuestos 2, detalles 2 y stock del material 1 en 120, sin cambios antes y después del pedido. |

