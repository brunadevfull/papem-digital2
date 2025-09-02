import { Github, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Projeto Template
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Este é um projeto base elegante, pronto para receber o código do seu repositório GitHub.
            </p>
          </div>

          {/* Main Card */}
          <Card className="p-8 mb-8 shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-center mb-6">
                <Github className="w-16 h-16 text-primary" />
              </div>
              
              <h2 className="text-2xl font-semibold mb-4">
                Pronto para Clone do GitHub
              </h2>
              
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Seu repositório está pronto para ser clonado. Este template fornece uma base sólida com design system configurado, 
                componentes UI modernos e estrutura otimizada.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={() => window.open('https://github.com/brunadevfull/papem-digital2.git', '_blank')}
                  className="flex items-center gap-2"
                >
                  <Github className="w-5 h-5" />
                  Ver Repositório
                  <ExternalLink className="w-4 h-4" />
                </Button>
                
                <Button variant="outline" size="lg">
                  Começar Clone
                </Button>
              </div>
            </div>
          </Card>

          {/* Instructions Card */}
          <Card className="p-6 text-left bg-card/60 backdrop-blur-sm border-0 shadow-soft">
            <h3 className="text-lg font-semibold mb-4 text-center">Próximos Passos</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                <span>Clone o repositório: <code className="text-primary bg-primary/10 px-2 py-1 rounded text-xs">git clone https://github.com/brunadevfull/papem-digital2.git</code></span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                <span>Instale as dependências: <code className="text-primary bg-primary/10 px-2 py-1 rounded text-xs">npm install</code></span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                <span>Execute o projeto: <code className="text-primary bg-primary/10 px-2 py-1 rounded text-xs">npm run dev</code></span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
