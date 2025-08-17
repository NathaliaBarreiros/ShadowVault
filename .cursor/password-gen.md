# Password Generation with ZK Proof of Strength - MVP Plan

## 🎯 **Objetivo MVP**
Crear un sistema que genere passwords aleatorias fuertes y genere pruebas ZK (Zero-Knowledge) que demuestren que la password cumple criterios de fortaleza sin revelar la password.

## ⏰ **Timeline: 1.5-2 horas (Hackathon)**

### **30 min: Setup Rápido**
- [ ] Instalar Noir CLI
- [ ] Crear proyecto básico
- [ ] Circuito simple de verificación

### **45 min: Implementación Core**
- [ ] Circuito básico (longitud + 3 clases)
- [ ] Integración con frontend existente
- [ ] Botón "Generate ZK Proof"

### **30 min: Testing y Demo**
- [ ] Probar con 2-3 passwords
- [ ] Verificar que funciona
- [ ] Preparar demo simple

### **15 min: Documentación**
- [ ] README básico
- [ ] Instrucciones de uso

## 🔄 **Flujo Completo del Sistema**

### **1. Generación de Password**
```typescript
// Usuario hace clic en "Generate Password"
const generatePassword = async () => {
  // 1. Generar password aleatoria (código actual)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  const len = 24;
  const array = new Uint32Array(len);
  
  crypto.getRandomValues(array);
  const password = Array.from(array, x => chars[x % chars.length]).join('');
  
  // 2. Verificar fortaleza localmente
  const strengthData = verifyPasswordStrength(password);
  
  // 3. Guardar para ZK proof
  setPasswordForZK(password);
  setStrengthData(strengthData);
  
  return password;
}
```

### **2. Verificación de Fortaleza**
```typescript
function verifyPasswordStrength(password: string) {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()_+]/.test(password);
  const length = password.length;
  
  const isStrong = hasUpperCase && hasLowerCase && hasNumbers && hasSymbols && length >= 12;
  
  return {
    isStrong,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSymbols,
    length
  };
}
```

### **3. Generación de ZK Proof**
```typescript
const generateZKProof = async (password: string) => {
  // 1. Preparar datos para el circuito Noir
  const passwordBytes = new TextEncoder().encode(password);
  
  // 2. Generar ZK proof usando Noir
  const proof = await noirCircuit.prove({
    password: Array.from(passwordBytes),
    // El circuito verifica internamente los criterios de fortaleza
  });
  
  // 3. Retornar proof para verificación
  return proof;
};
```

### **4. Verificación de ZK Proof**
```typescript
const verifyZKProof = async (proof: any) => {
  // 1. Verificar proof en el circuito Noir
  const isValid = await noirCircuit.verify(proof);
  
  // 2. Mostrar resultado
  if (isValid) {
    console.log('✅ ZK Proof válido: Password cumple criterios de fortaleza');
  } else {
    console.log('❌ ZK Proof inválido: Password no cumple criterios');
  }
  
  return isValid;
};
```

## 🔧 **Implementación Técnica**

### **Estructura de Carpetas**
```
ShadowVault/
├── noir-circuits/
│   ├── password-strength/
│   │   ├── src/
│   │   │   └── main.nr          # Circuito Noir principal
│   │   ├── Prover.toml          # Configuración del prover
│   │   └── Verifier.toml        # Configuración del verifier
│   └── package.json
├── ShadowVaultApp/
│   └── app/vault/add/page.tsx   # UI de generación
└── .cursor/
    └── password-gen.md          # Este archivo
```

### **Circuito Noir (main.nr)**
```noir
// Verificar fortaleza de password
fn verify_password_strength(password: [u8; 24]) -> bool {
    let mut has_upper = false;
    let mut has_lower = false;
    let mut has_number = false;
    let mut has_symbol = false;
    
    // Verificar cada carácter
    for i in 0..24 {
        let char = password[i];
        
        // Mayúsculas (A-Z = 65-90)
        if char >= 65 && char <= 90 { has_upper = true; }
        
        // Minúsculas (a-z = 97-122)
        if char >= 97 && char <= 122 { has_lower = true; }
        
        // Números (0-9 = 48-57)
        if char >= 48 && char <= 57 { has_number = true; }
        
        // Símbolos (!@#$%^&*()_+)
        if char == 33 || char == 64 || char == 35 || char == 36 || 
           char == 37 || char == 94 || char == 38 || char == 42 || 
           char == 40 || char == 41 || char == 95 || char == 43 { 
            has_symbol = true; 
        }
    }
    
    // Verificar longitud mínima (12 caracteres)
    let length_ok = true; // Asumimos 24 caracteres siempre
    
    // Verificar que cumple al menos 3 de 4 criterios
    let criteria_count = if has_upper { 1 } else { 0 } +
                        if has_lower { 1 } else { 0 } +
                        if has_number { 1 } else { 0 } +
                        if has_symbol { 1 } else { 0 };
    
    let criteria_ok = criteria_count >= 3;
    
    // Retornar true solo si cumple todos los criterios
    length_ok && criteria_ok
}
```

### **Integración en Frontend**
```typescript
// En ShadowVaultApp/app/vault/add/page.tsx

// Estado para ZK
const [passwordForZK, setPasswordForZK] = useState<string>('');
const [zkProof, setZkProof] = useState<any>(null);
const [zkVerified, setZkVerified] = useState<boolean | null>(null);

// Función para generar ZK proof
const handleGenerateZKProof = async () => {
  if (!passwordForZK) return;
  
  try {
    const proof = await generateZKProof(passwordForZK);
    setZkProof(proof);
    
    const isValid = await verifyZKProof(proof);
    setZkVerified(isValid);
    
    console.log('ZK Proof generado y verificado:', isValid);
  } catch (error) {
    console.error('Error generando ZK proof:', error);
  }
};

// Agregar botón en UI
<Button 
  onClick={handleGenerateZKProof}
  disabled={!passwordForZK}
  className="w-full"
>
  Generate ZK Proof of Strength
</Button>

{zkVerified !== null && (
  <div className={`p-4 rounded-lg ${zkVerified ? 'bg-green-100' : 'bg-red-100'}`}>
    {zkVerified ? 
      '✅ ZK Proof válido: Password cumple criterios de fortaleza' :
      '❌ ZK Proof inválido: Password no cumple criterios'
    }
  </div>
)}
```

## 🎯 **Criterios de Fortaleza (MVP)**

### **Criterios Mínimos:**
1. **Longitud**: ≥12 caracteres
2. **Clases de caracteres**: ≥3 de 4:
   - Mayúsculas (A-Z)
   - Minúsculas (a-z)
   - Números (0-9)
   - Símbolos (!@#$%^&*()_+)

### **Ejemplos de Passwords Válidas:**
- `"Kj8#mN2$pL9@xQ7&vR4!"` ✅ (24 chars, 4 clases)
- `"Password123!"` ✅ (12 chars, 3 clases)
- `"MyPass123"` ❌ (9 chars, 3 clases - muy corta)
- `"password123"` ❌ (12 chars, 2 clases - sin mayúsculas ni símbolos)

## 🔐 **Seguridad y Privacidad**

### **Ventajas del Enfoque ZK:**
- ✅ **Privacidad**: No revela la password, solo prueba que cumple criterios
- ✅ **Verificable**: Cualquiera puede verificar el proof sin conocer la password
- ✅ **Determinístico**: Misma password siempre produce mismo proof
- ✅ **Sin servidor**: Todo se ejecuta localmente

### **Limitaciones del MVP:**
- ❌ **No prueba generación aleatoria**: Solo verifica fortaleza
- ❌ **No prueba entropía**: No demuestra que la password fue generada correctamente
- ❌ **Verificación básica**: Criterios simples de fortaleza

## 🚀 **Próximos Pasos**

### **Inmediato (MVP):**
1. Crear estructura de carpetas Noir
2. Implementar circuito básico
3. Integrar con frontend
4. Probar con diferentes passwords

### **Futuro (Post-MVP):**
1. Agregar verificación de entropía
2. Implementar seed determinístico
3. Agregar más criterios de fortaleza
4. Integrar con smart contracts

## 📋 **Checklist de Implementación**

- [ ] Setup proyecto Noir
- [ ] Crear circuito de verificación
- [ ] Implementar verificación de caracteres
- [ ] Integrar con frontend
- [ ] Probar con casos edge
- [ ] Optimizar performance
- [ ] Documentar uso
- [ ] Preparar demo

## 🎯 **Objetivo Final (1.5-2 horas)**

Al final tendremos:
1. ✅ **Password generator** (ya tienes)
2. ✅ **ZK proof básico** que verifica fortaleza
3. ✅ **Botón en UI** que genera y verifica proof
4. ✅ **Demo funcional** simple

**¡Empezamos AHORA! 🚀**
