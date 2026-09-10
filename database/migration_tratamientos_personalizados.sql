-- ============================================================
-- MIGRACIÓN: Soporte para tratamientos personalizados/externos
-- Ejecutar en la base de datos vet_manager
-- ============================================================

USE vet_manager;

-- Hacer id_medicamento nullable para permitir tratamientos personalizados
ALTER TABLE medicamentos_asignados
MODIFY COLUMN id_medicamento INT NULL;

-- Agregar columna para nombre de medicamento personalizado/externo
ALTER TABLE medicamentos_asignados
ADD COLUMN nombre_personalizado VARCHAR(200) NULL AFTER instrucciones;

-- Agregar columna para tipo de tratamiento (catalogo o personalizado)
ALTER TABLE medicamentos_asignados
ADD COLUMN tipo_tratamiento ENUM('catalogo', 'personalizado') DEFAULT 'catalogo' AFTER nombre_personalizado;
