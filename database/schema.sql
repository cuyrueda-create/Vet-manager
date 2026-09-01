-- ==============================================
-- BASE DE DATOS VET MANAGER - SCRIPT COMPLETO
-- ==============================================

SET NAMES utf8mb4;

-- ==============================================
-- TABLA: usuarios
-- ==============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contrasea VARCHAR(200) NOT NULL,
    rol ENUM('administrador','veterinario','recepcionista','usuario') NOT NULL DEFAULT 'usuario',
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(30),
    telefono VARCHAR(20),
    direccion VARCHAR(150),
    nombre_negocio VARCHAR(150),
    direccion_negocio VARCHAR(200),
    especialidad VARCHAR(50),
    anos_experiencia INT,
    confirm_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    FOREIGN KEY (created_by) REFERENCES usuarios(id_usuario)
);

-- ==============================================
-- TABLA: clientes
-- ==============================================
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telefono VARCHAR(20) UNIQUE,
    direccion VARCHAR(150),
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(30),
    id_usuario INT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- ==============================================
-- TABLA: mascotas
-- ==============================================
CREATE TABLE IF NOT EXISTS mascotas (
    id_mascota INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_usuario INT NULL,
    nombre VARCHAR(60) NOT NULL,
    especie VARCHAR(40) NOT NULL,
    raza VARCHAR(40),
    sexo ENUM('M','H','Desconocido') DEFAULT 'Desconocido',
    edad INT,
    peso DECIMAL(5,2),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- ==============================================
-- TABLA: servicios
-- ==============================================
CREATE TABLE IF NOT EXISTS servicios (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL
);

-- ==============================================
-- TABLA: consultorio
-- ==============================================
CREATE TABLE IF NOT EXISTS consultorio (
    id_consultorio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50),
    ubicacion VARCHAR(100),
    estado VARCHAR(20)
);

-- ==============================================
-- TABLA: citas
-- ==============================================
CREATE TABLE IF NOT EXISTS citas (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_mascota INT NOT NULL,
    id_usuario_vet INT NOT NULL,
    id_servicio INT NOT NULL,
    id_consultorio INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('programada','realizada','cancelada') DEFAULT 'programada',
    id_usuario INT NULL,
    notas TEXT NULL,
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota),
    FOREIGN KEY (id_usuario_vet) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio),
    FOREIGN KEY (id_consultorio) REFERENCES consultorio(id_consultorio)
);

-- ==============================================
-- TABLA: insumos
-- ==============================================
CREATE TABLE IF NOT EXISTS insumos (
    id_insumo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    descripcion TEXT,
    cantidad INT NOT NULL,
    unidad VARCHAR(20),
    precio DECIMAL(10,2)
);

-- ==============================================
-- TABLA: inventario
-- ==============================================
CREATE TABLE IF NOT EXISTS inventario (
    id_mov INT AUTO_INCREMENT PRIMARY KEY,
    id_insumo INT NOT NULL,
    id_usuario INT NOT NULL,
    tipo_movimiento ENUM('entrada','salida') NOT NULL,
    cantidad INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- ==============================================
-- TABLA: reportes
-- ==============================================
CREATE TABLE IF NOT EXISTS reportes (
    id_reporte INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    fecha_generado DATETIME DEFAULT CURRENT_TIMESTAMP,
    generado_por INT NOT NULL,
    contenido TEXT,
    FOREIGN KEY (generado_por) REFERENCES usuarios(id_usuario)
);

-- ==============================================
-- TABLA: proveedores
-- ==============================================
CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion VARCHAR(150),
    id_usuario INT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- ==============================================
-- TABLA: productos
-- ==============================================
CREATE TABLE IF NOT EXISTS productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2),
    stock INT,
    id_proveedor INT,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

-- ==============================================
-- TABLA: medicamentos
-- ==============================================
CREATE TABLE IF NOT EXISTS medicamentos (
    id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    dosis VARCHAR(50),
    precio DECIMAL(10,2),
    stock INT,
    id_proveedor INT,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor)
);

-- ==============================================
-- TABLA: medicamentos_uso_interno
-- ==============================================
CREATE TABLE IF NOT EXISTS medicamentos_uso_interno (
    id_mov INT AUTO_INCREMENT PRIMARY KEY,
    id_medicamento INT NOT NULL,
    cantidad INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento)
);

-- ==============================================
-- TABLA: agenda
-- ==============================================
CREATE TABLE IF NOT EXISTS agenda (
    id_agenda INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL,
    recordatorio DATETIME,
    nota TEXT,
    FOREIGN KEY (id_cita) REFERENCES citas(id_cita)
);

-- ==============================================
-- TABLA: historial_clinico
-- ==============================================
CREATE TABLE IF NOT EXISTS historial_clinico (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_mascota INT NOT NULL,
    id_usuario INT NOT NULL,
    id_cita INT,
    diagnostico TEXT,
    tratamiento TEXT,
    observaciones TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    signos_vitales TEXT,
    peso_anterior DECIMAL,
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_cita) REFERENCES citas(id_cita)
);

-- ==============================================
-- TABLA: facturas
-- ==============================================
CREATE TABLE IF NOT EXISTS facturas (
    id_factura INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) UNIQUE NOT NULL,
    id_cliente INT NOT NULL,
    id_usuario INT NOT NULL,
    id_cita INT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    iva DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado ENUM('emitida','anulada','pagada','pendiente') DEFAULT 'emitida',
    fecha_vencimiento DATETIME NULL,
    enviado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_cita) REFERENCES citas(id_cita)
);

CREATE TABLE IF NOT EXISTS factura_detalle (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_factura INT NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (id_factura) REFERENCES facturas(id_factura)
);

-- ==============================================
-- VISTA SQL: vista_mascotas_clientes
-- ==============================================
CREATE OR REPLACE VIEW vista_mascotas_clientes AS
SELECT 
    m.id_mascota,
    m.nombre AS mascota_nombre,
    m.especie,
    m.raza,
    m.sexo,
    m.edad,
    m.peso,
    m.id_usuario,
    c.id_cliente,
    c.nombre AS cliente_nombre,
    c.apellido AS cliente_apellido,
    c.telefono AS cliente_telefono,
    COUNT(ct.id_cita) AS total_citas
FROM mascotas m
INNER JOIN clientes c ON m.id_cliente = c.id_cliente
LEFT JOIN citas ct ON m.id_mascota = ct.id_mascota
GROUP BY m.id_mascota, m.nombre, m.especie, m.raza, m.sexo, m.edad, m.peso, m.id_usuario, 
         c.id_cliente, c.nombre, c.apellido, c.telefono
ORDER BY m.nombre;

-- ==============================================
-- STORED PROCEDURE: sp_citas_activas
-- ==============================================
DELIMITER //
CREATE PROCEDURE sp_citas_activas()
BEGIN
    SELECT 
        c.id_cita,
        m.nombre AS mascota_nombre,
        CONCAT(cl.nombre, ' ', cl.apellido) AS cliente_nombre,
        c.fecha,
        c.hora,
        s.nombre AS servicio_nombre,
        c.estado,
        CONCAT(u.nombre, ' ', u.apellido) AS veterinario_nombre
    FROM citas c
    INNER JOIN mascotas m ON c.id_mascota = m.id_mascota
    INNER JOIN clientes cl ON m.id_cliente = cl.id_cliente
    INNER JOIN servicios s ON c.id_servicio = s.id_servicio
    INNER JOIN usuarios u ON c.id_usuario_vet = u.id_usuario
    WHERE c.estado = 'programada'
        AND CONCAT(c.fecha, ' ', c.hora) >= NOW()
    ORDER BY c.fecha ASC, c.hora ASC
    LIMIT 20;
END//
DELIMITER ;

-- ==============================================
-- TABLA DE NOTIFICACIONES
-- ==============================================
CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'general',
    leida BOOLEAN DEFAULT FALSE,
    enlace VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================
-- TABLA: medicamentos_asignados
-- ==============================================
CREATE TABLE IF NOT EXISTS medicamentos_asignados (
    id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
    id_historial INT NOT NULL,
    id_medicamento INT NOT NULL,
    dosis VARCHAR(100) NOT NULL,
    frecuencia VARCHAR(100) NULL,
    duracion VARCHAR(100) NULL,
    instrucciones TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_historial) REFERENCES historial_clinico(id_historial),
    FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento)
);
