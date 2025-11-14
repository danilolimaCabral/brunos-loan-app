# Sistema de Logos - Bruno's Loan

## Versões de Logo Disponíveis

O sistema Bruno's Loan possui duas versões do logo para se adaptar a diferentes temas de interface:

### 1. Logo Escuro (Padrão) - `/logo.png`
- **Cor**: Azul marinho escuro (#1E3A5F aproximadamente)
- **Uso**: Fundos claros (tela de login, áreas com fundo branco)
- **Fundo**: Transparente
- **Tamanho**: Otimizado para h-24 (tela de login) e h-10 (sidebar)

### 2. Logo Claro (Modo Escuro) - `/logo-dark.png`
- **Cor**: Branco/cinza muito claro (#F8F9FA)
- **Uso**: Fundos escuros (sidebar do dashboard, áreas com fundo escuro)
- **Fundo**: Transparente
- **Tamanho**: Otimizado para h-10 (sidebar)

## Implementação Atual

### Tela de Login (`Login.tsx`)
```tsx
import { APP_LOGO_LIGHT } from "@/const";
<img src={APP_LOGO_LIGHT} alt={APP_TITLE} className="h-24 object-contain" />
```
- Usa o logo escuro (APP_LOGO_LIGHT) pois o fundo é claro (gradiente azul claro)

### Dashboard Sidebar (`DashboardLayout.tsx`)
```tsx
import { APP_LOGO_DARK } from "@/const";
<img src={APP_LOGO_DARK} className="h-10 object-contain" alt="Logo" />
```
- Usa o logo claro (APP_LOGO_DARK) pois o sidebar tem fundo branco/claro

### Constantes (`const.ts`)
```tsx
export const APP_LOGO_LIGHT = "/logo.png"; // Logo escuro para fundos claros
export const APP_LOGO_DARK = "/logo-dark.png"; // Logo claro para fundos escuros
```

## Design do Logo

O logo apresenta:
- Letra **B** estilizada integrada ao símbolo do **cifrão ($)**
- Texto "BRUNO'S LOAN" em fonte bold e moderna
- Design profissional e minimalista
- Perfeita integração visual com o sistema

## Observações Técnicas

1. Ambos os logos têm **fundo transparente** para máxima flexibilidade
2. Tamanhos otimizados para diferentes contextos de uso
3. Formato PNG para preservar transparência e qualidade
4. Sistema preparado para futura implementação de troca automática baseada em tema
