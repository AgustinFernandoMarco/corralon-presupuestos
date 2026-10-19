/* =====================================================================
   CorralonDB - Presupuestador del Corralón Don Pedro
   Programación II - Clase 15
   Ejecutar completo en SSMS (se puede re-ejecutar: borra y recrea).
   ===================================================================== */
USE master;
GO
IF DB_ID(N'CorralonDB') IS NOT NULL
BEGIN
    ALTER DATABASE CorralonDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE CorralonDB;
END
GO
CREATE DATABASE CorralonDB;
GO
USE CorralonDB;
GO

/* ---------------------------------------------------------------------
   TABLAS
   --------------------------------------------------------------------- */
CREATE TABLE dbo.Materiales (
    IdMaterial INT IDENTITY(1,1) CONSTRAINT PK_Materiales PRIMARY KEY,
    Nombre     NVARCHAR(100) NOT NULL CONSTRAINT UQ_Materiales_Nombre UNIQUE,
    Unidad     NVARCHAR(20)  NOT NULL,
    Precio     DECIMAL(12,2) NOT NULL CONSTRAINT CK_Materiales_Precio CHECK (Precio > 0),
    Stock      INT           NOT NULL CONSTRAINT CK_Materiales_Stock  CHECK (Stock >= 0)
);

-- Cabecera. Fecha en UTC: el front la convierte a hora local al mostrarla.
CREATE TABLE dbo.Presupuestos (
    IdPresupuesto INT IDENTITY(1,1) CONSTRAINT PK_Presupuestos PRIMARY KEY,
    Cliente       NVARCHAR(100) NOT NULL,
    Fecha         DATETIME2(0)  NOT NULL CONSTRAINT DF_Presupuestos_Fecha DEFAULT SYSUTCDATETIME(),
    Total         DECIMAL(12,2) NOT NULL CONSTRAINT CK_Presupuestos_Total CHECK (Total >= 0)
);

-- Detalle. PrecioUnitario queda "congelado": es el precio vigente al guardar.
CREATE TABLE dbo.DetallePresupuesto (
    IdDetalle      INT IDENTITY(1,1) CONSTRAINT PK_DetallePresupuesto PRIMARY KEY,
    IdPresupuesto  INT NOT NULL CONSTRAINT FK_Detalle_Presupuesto REFERENCES dbo.Presupuestos(IdPresupuesto),
    IdMaterial     INT NOT NULL CONSTRAINT FK_Detalle_Material    REFERENCES dbo.Materiales(IdMaterial),
    Cantidad       INT NOT NULL CONSTRAINT CK_Detalle_Cantidad CHECK (Cantidad > 0),
    PrecioUnitario DECIMAL(12,2) NOT NULL CONSTRAINT CK_Detalle_Precio CHECK (PrecioUnitario > 0),
    CONSTRAINT UQ_Detalle_PresupuestoMaterial UNIQUE (IdPresupuesto, IdMaterial)
);
GO

/* ---------------------------------------------------------------------
   DATOS DE PRUEBA
   --------------------------------------------------------------------- */
INSERT INTO dbo.Materiales (Nombre, Unidad, Precio, Stock) VALUES
 (N'Cemento Portland 50 kg',   N'bolsa', 9800.00,  120),
 (N'Cal hidratada 25 kg',      N'bolsa', 5200.00,   80),
 (N'Arena fina',               N'm3',   28000.00,   30),
 (N'Piedra partida 6-20',      N'm3',   35000.00,   25),
 (N'Ladrillo hueco 12x18x33',  N'unidad',  780.00, 2000),
 (N'Hierro del 8 mm (12 m)',   N'barra', 11500.00,  200),
 (N'Hierro del 10 mm (12 m)',  N'barra', 17800.00,  150),
 (N'Malla sima 15x15 4.2 mm',  N'panel', 62000.00,   40),
 (N'Pintura látex interior 20 l', N'balde', 86000.00, 15),
 (N'Cerámico 45x45 (caja 2 m2)',  N'caja',  23500.00, 60);
GO

/* ---------------------------------------------------------------------
   usp_ListarMateriales
   --------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_ListarMateriales
AS
BEGIN
    SET NOCOUNT ON;
    SELECT IdMaterial, Nombre, Unidad, Precio, Stock
    FROM dbo.Materiales
    ORDER BY Nombre;
END
GO

/* ---------------------------------------------------------------------
   usp_ListarPresupuestos (con COUNT de items)
   --------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_ListarPresupuestos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.IdPresupuesto,
           p.Cliente,
           p.Fecha,
           p.Total,
           COUNT(d.IdDetalle) AS CantidadItems
    FROM dbo.Presupuestos p
    LEFT JOIN dbo.DetallePresupuesto d ON d.IdPresupuesto = p.IdPresupuesto
    GROUP BY p.IdPresupuesto, p.Cliente, p.Fecha, p.Total
    ORDER BY p.Fecha DESC, p.IdPresupuesto DESC;
END
GO

/* ---------------------------------------------------------------------
   usp_CrearPresupuesto  (la estrella)

   @Items  : JSON con el carrito, ej: [{"id":1,"cantidad":3},{"id":5,"cantidad":100}]
             SOLO trae ids y cantidades. Los precios los pone esta base.
   OUTPUT  : @IdPresupuesto y @Total (calculado con los precios de la TABLA).

   Errores (THROW):
     50031  items vacíos o JSON inválido
     50020  alguna cantidad <= 0 (o no numérica)
     50029  algún material no existe
     50030  stock insuficiente
   Todo ocurre en UNA transacción: si algo falla, no queda nada a medias.
   --------------------------------------------------------------------- */
CREATE OR ALTER PROCEDURE dbo.usp_CrearPresupuesto
    @Cliente       NVARCHAR(100),
    @Items         NVARCHAR(MAX),
    @IdPresupuesto INT           OUTPUT,
    @Total         DECIMAL(12,2) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Carrito  TABLE (IdMaterial INT NULL, Cantidad INT NULL);
    DECLARE @Agrupado TABLE (IdMaterial INT NOT NULL PRIMARY KEY, Cantidad INT NOT NULL);
    DECLARE @Faltante NVARCHAR(100);
    DECLARE @Mensaje  NVARCHAR(2048);

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1) Abrir el JSON (OPENJSON ... WITH: cada elemento trae VARIOS campos)
        IF @Items IS NULL OR ISJSON(@Items) = 0
            THROW 50031, N'El carrito está vacío o no tiene un formato válido.', 1;

        INSERT INTO @Carrito (IdMaterial, Cantidad)
        SELECT IdMaterial, Cantidad
        FROM OPENJSON(@Items)
             WITH (
                 IdMaterial INT '$.id',
                 Cantidad   INT '$.cantidad'
             );

        -- 2) Validaciones
        IF NOT EXISTS (SELECT 1 FROM @Carrito)
            THROW 50031, N'El presupuesto no tiene items.', 1;

        IF EXISTS (SELECT 1 FROM @Carrito WHERE Cantidad IS NULL OR Cantidad <= 0)
            THROW 50020, N'Todas las cantidades deben ser mayores a cero.', 1;

        IF EXISTS (SELECT 1
                   FROM @Carrito c
                   LEFT JOIN dbo.Materiales m ON m.IdMaterial = c.IdMaterial
                   WHERE m.IdMaterial IS NULL)
            THROW 50029, N'El presupuesto incluye un material que no existe.', 1;

        -- Si el JSON repite un material, se suman las cantidades
        INSERT INTO @Agrupado (IdMaterial, Cantidad)
        SELECT IdMaterial, SUM(Cantidad)
        FROM @Carrito
        GROUP BY IdMaterial;

        -- Stock: se bloquean las filas (UPDLOCK, HOLDLOCK) hasta el COMMIT, así
        -- dos presupuestos simultáneos no pueden vender el mismo stock dos veces.
        SELECT TOP (1) @Faltante = m.Nombre
        FROM @Agrupado a
        JOIN dbo.Materiales m WITH (UPDLOCK, HOLDLOCK) ON m.IdMaterial = a.IdMaterial
        WHERE m.Stock < a.Cantidad;

        IF @Faltante IS NOT NULL
        BEGIN
            SET @Mensaje = CONCAT(N'Stock insuficiente de ', @Faltante, N'.');
            THROW 50030, @Mensaje, 1;
        END

        -- 3) El total lo calcula LA BASE con los precios de la tabla
        SELECT @Total = SUM(a.Cantidad * m.Precio)
        FROM @Agrupado a
        JOIN dbo.Materiales m ON m.IdMaterial = a.IdMaterial;

        -- 4) Cabecera + detalle (PrecioUnitario congelado) + descuento de stock
        INSERT INTO dbo.Presupuestos (Cliente, Total)
        VALUES (LTRIM(RTRIM(@Cliente)), @Total);

        SET @IdPresupuesto = SCOPE_IDENTITY();

        INSERT INTO dbo.DetallePresupuesto (IdPresupuesto, IdMaterial, Cantidad, PrecioUnitario)
        SELECT @IdPresupuesto, a.IdMaterial, a.Cantidad, m.Precio
        FROM @Agrupado a
        JOIN dbo.Materiales m ON m.IdMaterial = a.IdMaterial;

        UPDATE m
        SET m.Stock = m.Stock - a.Cantidad
        FROM dbo.Materiales m
        JOIN @Agrupado a ON a.IdMaterial = m.IdMaterial;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @IdPresupuesto = NULL;
        SET @Total = NULL;
        THROW;  -- relanza el MISMO error (mismo número y mensaje) al backend
    END CATCH
END
GO

/* ---------------------------------------------------------------------
   Pruebas rápidas desde SSMS (opcional)
   --------------------------------------------------------------------- */
/*
DECLARE @id INT, @total DECIMAL(12,2);
EXEC dbo.usp_CrearPresupuesto
     @Cliente = N'Cliente de prueba',
     @Items   = N'[{"id":1,"cantidad":3},{"id":5,"cantidad":100}]',
     @IdPresupuesto = @id OUTPUT,
     @Total = @total OUTPUT;
SELECT @id AS IdPresupuesto, @total AS Total;
EXEC dbo.usp_ListarPresupuestos;
EXEC dbo.usp_ListarMateriales;
*/
