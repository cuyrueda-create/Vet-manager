-- ============================================================
-- BASEDEDATOS VET MANAGER - TABLAS E INSERTS
-- ============================================================
-- Copia y pega todo esto en MySQL Workbench, HeidiSQL, DBeaver,
-- o impÃ³rtalo con: mysql -u root -p < basededatos.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS vet_manager;
USE vet_manager;

-- ==================== USUARIOS ====================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(20) NULL,
    direccion VARCHAR(150) NULL,
    contraseÃ±a VARCHAR(200) NOT NULL,
 rol ENUM('administrador','veterinario','recepcionista','usuario') NOT NULL DEFAULT 'usuario',
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(30),
    nombre_negocio VARCHAR(150),
    direccion_negocio VARCHAR(200),
    especialidad VARCHAR(50),
    anos_experiencia INT,
    reset_token VARCHAR(255) NULL,
    confirm_token VARCHAR(255) NULL,
is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    FOREIGN KEY (created_by) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== CLIENTES ====================
CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    email VARCHAR(100) NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(150),
    tipo_documento VARCHAR(20),
    numero_documento VARCHAR(30),
    id_usuario INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre, apellido),
    UNIQUE INDEX uq_clientes_email (email),
    UNIQUE INDEX uq_clientes_telefono (telefono)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== MASCOTAS ====================
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
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
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
    id_usuario INT NULL,
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

-- ==================== NOTIFICACIONES ====================
CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'general',
    leida BOOLEAN DEFAULT FALSE,
    enlace VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    INDEX idx_usuario_leida (id_usuario, leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== MEDICAMENTOS ASIGNADOS ====================
CREATE TABLE IF NOT EXISTS medicamentos_asignados (
    id_asignacion INT AUTO_INCREMENT PRIMARY KEY,
    id_historial INT NOT NULL,
    id_medicamento INT NOT NULL,
    dosis VARCHAR(50),
    frecuencia VARCHAR(100),
    duracion VARCHAR(50),
    instrucciones TEXT,
    FOREIGN KEY (id_historial) REFERENCES historial_clinico(id_historial) ON DELETE CASCADE,
    FOREIGN KEY (id_medicamento) REFERENCES medicamentos(id_medicamento) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATOS DE PRUEBA
-- ============================================================

-- USUARIOS (contraseÃ±a hasheada de "1234")
INSERT INTO usuarios (nombre, apellido, email, telefono, direccion, contraseÃ±a, rol, tipo_documento, numero_documento) VALUES
('Luis','Cuy','cuyrueda@gmail.com','3200000000','Cra 1 #1-01','$pbkdf2-sha256$10000$FhJirNVay3nvPQdg7N07xw$oHdGDN5qF5S2Yd3f9K0F0sN0G1b2c3d4e5f6g7h8i9j0k','administrador','CC','1011'),
('MarÃ­a','LÃ³pez','maria@vet.com','3122222222','Cll 5 #15-22','$pbkdf2-sha256$10000$FhJirNVay3nvPQdg7N07xw$oHdGDN5qF5S2Yd3f9K0F0sN0G1b2c3d4e5f6g7h8i9j0k','veterinario','CC','1002'),
('Carlos','PÃ©rez','carlos@vet.com','3133333333','Cra 45 #12-08','$pbkdf2-sha256$10000$FhJirNVay3nvPQdg7N07xw$oHdGDN5qF5S2Yd3f9K0F0sN0G1b2c3d4e5f6g7h8i9j0k','veterinario','CC','1003'),
('Ana','Ruiz','ana@vet.com','3144444444','Cll 90 #22-34','$pbkdf2-sha256$10000$FhJirNVay3nvPQdg7N07xw$oHdGDN5qF5S2Yd3f9K0F0sN0G1b2c3d4e5f6g7h8i9j0k','usuario','TI','1004'),
('Laura','MÃ©ndez','laura@vet.com','3155555555','Cra 12 #33-21','$pbkdf2-sha256$10000$FhJirNVay3nvPQdg7N07xw$oHdGDN5qF5S2Yd3f9K0F0sN0G1b2c3d4e5f6g7h8i9j0k','usuario','CC','1005'),
('Diego','MartÃ­nez','diego@vet.com','3166666666','Cll 11 #7-40','$pbkdf2-sha256$10000$FhJirNVay3nvPQdg7N07xw$oHdGDN5qF5S2Yd3f9K0F0sN0G1b2c3d4e5f6g7h8i9j0k','veterinario','CE','1006'),
('Andrea','Rojas','andrea@vet.com','3177777777','Cra 30 #10-10','$pbkdf2-sha256$10000$FhJirNVay3nvPQdg7N07xw$oHdGDN5qF5S2Yd3f9K0F0sN0G1b2c3d4e5f6g7h8i9j0k','administrador','CC','1007'),
('Luis','Castro','luis@vet.com','3188888888','Cll 14 #18-05','$pbkdf2-sha256$10000$FhJirNVay3nvPQdg7N07xw$oHdGDN5qF5S2Yd3f9K0F0sN0G1b2c3d4e5f6g7h8i9j0k','veterinario','CC','1008'),
('Paula','Reyes','paula@vet.com','3199999999','Cra 55 #1-45','$pbkdf2-sha256$10000$FhJirNVay3nvPQdg7N07xw$oHdGDN5qF5S2Yd3f9K0F0sN0G1b2c3d4e5f6g7h8i9j0k','usuario','TI','1009'),
('SofÃ­a','Vargas','sofia@vet.com','3100000000','Cll 100 #30-90','$pbkdf2-sha256$10000$FhJirNVay3nvPQdg7N07xw$oHdGDN5qF5S2Yd3f9K0F0sN0G1b2c3d4e5f6g7h8i9j0k','veterinario','CC','1010');

-- CLIENTES
INSERT INTO clientes (nombre, apellido, telefono, direccion, tipo_documento, numero_documento) VALUES
('Carlos','JimÃ©nez','3111111111','Cra 10 # 20-30','CC','2001'),
('Laura','Torres','3122222222','Cll 5 # 15-22','CC','2002'),
('AndrÃ©s','Villa','3133333333','Cra 45 # 12-08','CE','2003'),
('Juliana','HernÃ¡ndez','3144444444','Cll 90 # 22-34','CC','2004'),
('Santiago','RÃ­os','3155555555','Cra 12 # 33-21','CC','2005'),
('Diana','MuÃ±oz','3166666666','Cll 11 # 7-40','TI','2006'),
('Felipe','Cardona','3177777777','Cra 30 # 10-10','CC','2007'),
('Marta','Orozco','3188888888','Cll 14 # 18-05','CC','2008'),
('Jorge','LÃ³pez','3199999999','Cra 55 # 1-45','CC','2009'),
('Natalia','Cano','3100000000','Cll 100 # 30-90','CC','2010');

-- MASCOTAS
INSERT INTO mascotas (id_cliente, nombre, especie, raza, sexo, edad, peso, observaciones) VALUES
(1,'Max','Perro','Labrador','M',5,30.2,'Muy amigable'),
(2,'Luna','Gato','Persa','H',3,4.5,'Le teme a los ruidos fuertes'),
(3,'Rocky','Perro','Bulldog','M',4,22.1,NULL),
(4,'Misu','Gato','Criollo','H',2,3.8,NULL),
(5,'Toby','Perro','Poodle','M',6,8.3,'Problemas de piel'),
(6,'Coco','Ave','Loro','Desconocido',10,1.2,NULL),
(7,'Nala','Gato','SiamÃ©s','H',1,3.0,NULL),
(8,'Simba','Perro','Golden','M',2,28.0,NULL),
(9,'Bunny','Conejo','Mini Lop','H',1,1.1,NULL),
(10,'Rex','Perro','Pastor AlemÃ¡n','M',7,35.0,NULL);

-- SERVICIOS
INSERT INTO servicios (nombre, descripcion, precio) VALUES
('Consulta General','RevisiÃ³n mÃ©dica de rutina',35000),
('VacunaciÃ³n','AplicaciÃ³n de vacunas',50000),
('DesparasitaciÃ³n','Tratamiento interno y externo',30000),
('BaÃ±o','BaÃ±o con shampoo especial',25000),
('Corte de uÃ±as','Corte y limpieza de uÃ±as',15000),
('CirugÃ­a menor','Procedimientos menores',150000),
('RadiografÃ­a','Estudio de rayos X',70000),
('EcografÃ­a','Imagen por ultrasonido',85000),
('Urgencias','AtenciÃ³n inmediata',120000),
('OdontologÃ­a','Limpieza dental',90000);

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
('Guantes','Guantes de lÃ¡tex',200,'par',300),
('Gasas','Gasas estÃ©riles',150,'paquete',1000),
('Alcohol','Alcohol antisÃ©ptico',20,'botella',4000),
('AntibiÃ³tico','Medicamento inyectable',30,'frascos',12000),
('Desinfectante','Limpieza profunda',10,'galÃ³n',25000),
('Sueros','SoluciÃ³n salina',40,'bolsa',8000),
('Vitaminas','Vitaminas inyectables',25,'frasco',15000),
('Agujas','Agujas hipodÃ©rmicas',300,'unidad',200),
('Vendas','Vendas elÃ¡sticas',50,'rollo',2500);

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
('ropa canina','ropa para clima frÃ­o',45000,20,8),
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

-- ==================== FACTURAS ====================
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
    estado ENUM('emitida','anulada') DEFAULT 'emitida',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_cita) REFERENCES citas(id_cita) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS factura_detalle (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_factura INT NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (id_factura) REFERENCES facturas(id_factura) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ALTERS PARA NUEVAS FUNCIONALIDADES ====================
-- Agregar signos_vitales y peso_anterior al historial clinico
ALTER TABLE historial_clinico
ADD COLUMN signos_vitales TEXT AFTER observaciones,
ADD COLUMN peso_anterior DECIMAL(5,2) AFTER signos_vitales;

-- Agregar id_recepcionista a citas
ALTER TABLE citas
ADD COLUMN id_recepcionista INT NULL AFTER id_usuario;




