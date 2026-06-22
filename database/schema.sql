-- database/schema.sql
-- Base de datos Vet Manager - Adaptada para Docker
-- Se ejecuta automáticamente al iniciar el contenedor MySQL

CREATE DATABASE IF NOT EXISTS vet_manager;
USE vet_manager;

-- ==================== USUARIOS ====================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contraseña VARCHAR(200) NOT NULL,
    rol ENUM('admin','veterinario','asistente') NOT NULL,
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(30),
    reset_token VARCHAR(255) NULL,
    reset_token_expires DATETIME NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== CLIENTES ====================
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(150),
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre, apellido),
    INDEX idx_telefono (telefono)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== MASCOTAS ====================
CREATE TABLE IF NOT EXISTS mascotas (
    id_mascota INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    nombre VARCHAR(60) NOT NULL,
    especie VARCHAR(40) NOT NULL,
    raza VARCHAR(40),
    sexo ENUM('M','H','Desconocido') DEFAULT 'Desconocido',
    edad INT,
    peso DECIMAL(5,2),
    observaciones TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    INDEX idx_cliente (id_cliente),
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== SERVICIOS ====================
CREATE TABLE IF NOT EXISTS servicios (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== CONSULTORIO ====================
CREATE TABLE IF NOT EXISTS consultorio (
    id_consultorio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50),
    ubicacion VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== CITAS ====================
CREATE TABLE IF NOT EXISTS citas (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    id_mascota INT NOT NULL,
    id_usuario_vet INT NOT NULL,
    id_servicio INT NOT NULL,
    id_consultorio INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('programada','realizada','cancelada') DEFAULT 'programada',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_vet) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio) ON DELETE CASCADE,
    FOREIGN KEY (id_consultorio) REFERENCES consultorio(id_consultorio) ON DELETE CASCADE,
    INDEX idx_mascota (id_mascota),
    INDEX idx_fecha (fecha),
    INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== INSUMOS ====================
CREATE TABLE IF NOT EXISTS insumos (
    id_insumo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    descripcion TEXT,
    cantidad INT NOT NULL,
    unidad VARCHAR(20),
    precio DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== INVENTARIO ====================
CREATE TABLE IF NOT EXISTS inventario (
    id_mov INT AUTO_INCREMENT PRIMARY KEY,
    id_insumo INT NOT NULL,
    id_usuario INT NOT NULL,
    tipo_movimiento ENUM('entrada','salida') NOT NULL,
    cantidad INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== REPORTES ====================
CREATE TABLE IF NOT EXISTS reportes (
    id_reporte INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    fecha_generado DATETIME DEFAULT CURRENT_TIMESTAMP,
    generado_por INT NOT NULL,
    contenido TEXT,
    FOREIGN KEY (generado_por) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PROVEEDORES ====================
CREATE TABLE IF NOT EXISTS proveedores (
    id_proveedor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion VARCHAR(150),
    id_usuario INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PRODUCTOS ====================
CREATE TABLE IF NOT EXISTS productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2),
    stock INT,
    id_proveedor INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== MEDICAMENTOS ====================
CREATE TABLE IF NOT EXISTS medicamentos (
    id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    dosis VARCHAR(50),
    precio DECIMAL(10,2),
    stock INT,
    id_proveedor INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== MEDICAMENTOS USO INTERNO ====================
CREATE TABLE IF NOT EXISTS medicamentos_uso_interno (
    id_mov INT AUTO_INCREMENT PRIMARY KEY,
    id_medicamento INT NOT NULL,
    cantidad INT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacion TEXT,
    FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== AGENDA ====================
CREATE TABLE IF NOT EXISTS agenda (
    id_agenda INT AUTO_INCREMENT PRIMARY KEY,
    id_cita INT NOT NULL,
    recordatorio DATETIME,
    nota TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== HISTORIAL CLINICO ====================
CREATE TABLE IF NOT EXISTS historial_clinico (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_mascota INT NOT NULL,
    id_usuario INT NOT NULL,
    id_cita INT,
    diagnostico TEXT,
    tratamiento TEXT,
    observaciones TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mascota) REFERENCES mascotas(id_mascota) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== DATOS DE PRUEBA ====================

-- USUARIOS
INSERT INTO usuarios (nombre, apellido, email, contraseña, rol, tipo_documento, numero_documento) VALUES
('Juan','Gómez','juan@vet.com','1234','admin','CC','1001'),
('María','López','maria@vet.com','1234','veterinario','CC','1002'),
('Carlos','Pérez','carlos@vet.com','1234','veterinario','CC','1003'),
('Ana','Ruiz','ana@vet.com','1234','asistente','TI','1004'),
('Laura','Méndez','laura@vet.com','1234','asistente','CC','1005'),
('Diego','Martínez','diego@vet.com','1234','veterinario','CE','1006'),
('Andrea','Rojas','andrea@vet.com','1234','admin','CC','1007'),
('Luis','Castro','luis@vet.com','1234','veterinario','CC','1008'),
('Paula','Reyes','paula@vet.com','1234','asistente','TI','1009'),
('Sofía','Vargas','sofia@vet.com','1234','veterinario','CC','1010');

-- CLIENTES
INSERT INTO clientes (nombre, apellido, telefono, direccion, tipo_documento, numero_documento) VALUES
('Carlos','Jiménez','3111111111','Cra 10 # 20-30','CC','2001'),
('Laura','Torres','3122222222','Cll 5 # 15-22','CC','2002'),
('Andrés','Villa','3133333333','Cra 45 # 12-08','CE','2003'),
('Juliana','Hernández','3144444444','Cll 90 # 22-34','CC','2004'),
('Santiago','Ríos','3155555555','Cra 12 # 33-21','CC','2005'),
('Diana','Muñoz','3166666666','Cll 11 # 7-40','TI','2006'),
('Felipe','Cardona','3177777777','Cra 30 # 10-10','CC','2007'),
('Marta','Orozco','3188888888','Cll 14 # 18-05','CC','2008'),
('Jorge','López','3199999999','Cra 55 # 1-45','CC','2009'),
('Natalia','Cano','3100000000','Cll 100 # 30-90','CC','2010');

-- MASCOTAS
INSERT INTO mascotas (id_cliente, nombre, especie, raza, sexo, edad, peso, observaciones) VALUES
(1,'Max','Perro','Labrador','M',5,30.2,'Muy amigable'),
(2,'Luna','Gato','Persa','H',3,4.5,'Le teme a los ruidos fuertes'),
(3,'Rocky','Perro','Bulldog','M',4,22.1,NULL),
(4,'Misu','Gato','Criollo','H',2,3.8,NULL),
(5,'Toby','Perro','Poodle','M',6,8.3,'Problemas de piel'),
(6,'Coco','Ave','Loro','Desconocido',10,1.2,NULL),
(7,'Nala','Gato','Siamés','H',1,3.0,NULL),
(8,'Simba','Perro','Golden','M',2,28.0,NULL),
(9,'Bunny','Conejo','Mini Lop','H',1,1.1,NULL),
(10,'Rex','Perro','Pastor Alemán','M',7,35.0,NULL);

-- SERVICIOS
INSERT INTO servicios (nombre, descripcion, precio) VALUES
('Consulta General','Revisión médica de rutina',35000),
('Vacunación','Aplicación de vacunas',50000),
('Desparasitación','Tratamiento interno y externo',30000),
('Baño','Baño con shampoo especial',25000),
('Corte de uñas','Corte y limpieza de uñas',15000),
('Cirugía menor','Procedimientos menores',150000),
('Radiografía','Estudio de rayos X',70000),
('Ecografía','Imagen por ultrasonido',85000),
('Urgencias','Atención inmediata',120000),
('Odontología','Limpieza dental',90000);

-- CONSULTORIO
INSERT INTO consultorio (nombre, ubicacion, estado) VALUES
('consultorio 1','primer piso','activo'),
('consultorio 2','primer piso','activo'),
('consultorio 3','segundo piso','activo'),
('quirofano','segundo piso','activo'),
('sala rayos x','segundo piso','activo'),
('sala espera','primer piso','activo'),
('consultorio 4','segundo piso','activo'),
('consultorio 5','tercer piso','activo'),
('laboratorio','tercer piso','activo'),
('urgencias','primer piso','activo');

-- CITAS
INSERT INTO citas (id_mascota,id_usuario_vet,id_servicio,id_consultorio,fecha,hora,estado) VALUES
(1,2,1,1,'2025-02-01','10:00','programada'),
(2,3,2,2,'2025-02-02','09:30','realizada'),
(3,2,3,3,'2025-02-03','11:00','cancelada'),
(4,3,4,4,'2025-02-04','14:00','programada'),
(5,2,5,5,'2025-02-05','15:00','realizada'),
(6,3,7,6,'2025-02-06','16:00','programada'),
(7,8,1,7,'2025-02-07','08:00','realizada'),
(8,2,2,8,'2025-02-08','17:30','programada'),
(9,3,6,9,'2025-02-09','13:00','realizada'),
(10,8,9,10,'2025-02-10','12:00','programada');

-- INSUMOS
INSERT INTO insumos (nombre, descripcion, cantidad, unidad, precio) VALUES
('Jeringas','Jeringas de 5ml',100,'unidad',500),
('Guantes','Guantes de látex',200,'par',300),
('Gasas','Gasas estériles',150,'paquete',1000),
('Alcohol','Alcohol antiséptico',20,'botella',4000),
('Antibiótico','Medicamento inyectable',30,'frascos',12000),
('Desinfectante','Limpieza profunda',10,'galón',25000),
('Sueros','Solución salina',40,'bolsa',8000),
('Vitaminas','Vitaminas inyectables',25,'frasco',15000),
('Agujas','Agujas hipodérmicas',300,'unidad',200),
('Vendas','Vendas elásticas',50,'rollo',2500);

-- PROVEEDORES
INSERT INTO proveedores (nombre,telefono,email,direccion,id_usuario) VALUES
('distribuidora vetcol','3001111111','contacto@vetcol.com','cra 10 #20-30',1),
('animal supply','3002222222','info@animalsupply.com','cll 5 #15-22',2),
('farmavet','3003333333','ventas@farmavet.com','cra 45 #12-08',3),
('medivet','3004444444','soporte@medivet.com','cll 90 #22-34',4),
('vet insumos sas','3005555555','contacto@insumos.com','cra 12 #33-21',5),
('proveedor salud animal','3006666666','ventas@saludanimal.com','cll 11 #7-40',6),
('global vet','3007777777','info@globalvet.com','cra 30 #10-10',7),
('bioanimal','3008888888','contacto@bioanimal.com','cll 14 #18-05',8),
('distribuciones pet','3009999999','ventas@pet.com','cra 55 #1-45',9),
('vet market','3000000000','info@vetmarket.com','cll 100 #30-90',10);

-- PRODUCTOS
INSERT INTO productos (nombre,descripcion,precio,stock,id_proveedor) VALUES
('shampoo canino','limpieza para perros',25000,30,1),
('alimento premium','comida balanceada',80000,50,2),
('arena para gatos','arena sanitaria',30000,40,3),
('juguete mordedor','juguete resistente',15000,25,4),
('collar ajustable','collar para mascotas',12000,60,5),
('transportador','caja para transporte',90000,10,6),
('peine mascota','peine especial',10000,35,7),
('ropa canina','ropa para clima frío',45000,20,8),
('plato acero','plato para comida',18000,45,9),
('cama mascota','cama acolchada',95000,15,10);

-- MEDICAMENTOS
INSERT INTO medicamentos (nombre,descripcion,dosis,precio,stock,id_proveedor) VALUES
('antibiotico vet','tratamiento infecciones','5ml',12000,30,1),
('vitamina b12','suplemento vitaminico','2ml',8000,25,2),
('antiparasitario','control de parasitos','10ml',15000,40,3),
('analgesico','control del dolor','5ml',10000,20,4),
('vacuna triple','vacuna preventiva','1 dosis',50000,15,5),
('antiinflamatorio','reduce inflamacion','3ml',9000,18,6),
('suero oral','hidratacion','250ml',6000,35,7),
('desparasitante','uso interno','5ml',14000,22,8),
('antialergico','control alergias','2ml',11000,17,9),
('sedante','procedimientos medicos','3ml',20000,10,10);

-- HISTORIAL CLINICO
INSERT INTO historial_clinico (id_mascota,id_usuario,id_cita,diagnostico,tratamiento,observaciones) VALUES
(1,2,1,'revision general','vitaminas','estable'),
(2,3,2,'infeccion leve','antibiotico','mejorando'),
(3,2,3,'problema digestivo','dieta especial','control'),
(4,3,4,'revision','ninguno','normal'),
(5,2,5,'problema piel','medicacion','seguimiento'),
(6,3,6,'chequeo','ninguno','estable'),
(7,8,7,'vacunacion','vacuna aplicada','ok'),
(8,2,8,'revision','vitaminas','estable'),
(9,3,9,'fractura leve','reposo','seguimiento'),
(10,8,10,'urgencia','tratamiento inmediato','observacion');

-- AGENDA
INSERT INTO agenda (id_cita,recordatorio,nota) VALUES
(1,'2025-02-01 09:00:00','recordar cliente'),
(2,'2025-02-02 08:30:00','confirmar asistencia'),
(3,'2025-02-03 10:00:00','preparar sala'),
(4,'2025-02-04 13:00:00','llevar historial'),
(5,'2025-02-05 14:00:00','confirmado'),
(6,'2025-02-06 15:00:00','urgente'),
(7,'2025-02-07 07:00:00','cliente frecuente'),
(8,'2025-02-08 16:30:00','pendiente'),
(9,'2025-02-09 12:00:00','tratamiento'),
(10,'2025-02-10 11:00:00','control');

-- ==================== VISTAS ====================

-- Vista de mascotas con dueños
CREATE OR REPLACE VIEW vista_mascotas_clientes AS
SELECT 
    m.id_mascota,
    m.nombre AS mascota_nombre,
    m.especie,
    m.raza,
    m.sexo,
    m.edad,
    m.peso,
    c.id_cliente,
    c.nombre AS cliente_nombre,
    c.apellido AS cliente_apellido,
    c.telefono AS cliente_telefono,
    COUNT(ct.id_cita) AS total_citas
FROM mascotas m
INNER JOIN clientes c ON m.id_cliente = c.id_cliente
LEFT JOIN citas ct ON m.id_mascota = ct.id_mascota
GROUP BY m.id_mascota, c.id_cliente
ORDER BY m.nombre;

-- ==================== STORED PROCEDURE ====================

DELIMITER //
CREATE OR REPLACE PROCEDURE sp_citas_activas()
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